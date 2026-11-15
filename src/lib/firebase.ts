/**
 * Firebase do app: login (Auth), banco (Firestore) e funções do servidor (Cloud Functions).
 *
 * Cada conta usa uma instância própria do Firebase ("app nomeado"), com a sessão salva
 * separada no aparelho: o responsável usa a instância padrão e cada criança lembrada tem
 * a dela (`child:<login>`). Assim a criança entra de novo tocando no personagem, sem senha,
 * e trocar de conta não apaga a sessão das outras crianças lembradas.
 * A sessão do responsável nunca fica guardada quando outra conta assume o aparelho.
 */
import { deleteApp, initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, inMemoryPersistence, initializeAuth, onAuthStateChanged, signOut, type Auth, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';

const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
};

/** Região das Cloud Functions (igual a functions/src/index.ts). */
const REGION = import.meta.env.VITE_FIREBASE_REGION || 'southamerica-east1';

export function isFirebaseConfigured(): boolean {
  return Boolean(
    config.apiKey && config.projectId && config.appId && !String(config.apiKey).startsWith('your-')
  );
}

/** Domínio interno do e-mail das contas de criança (nenhum e-mail é enviado). Também conferido no firebase/firestore.rules. */
export const CHILD_EMAIL_DOMAIN = import.meta.env.VITE_CHILD_EMAIL_DOMAIN || 'crianca.minelearn.app';
export const childEmail = (username: string) => `${username}@${CHILD_EMAIL_DOMAIN}`;
export const isChildEmail = (email: string | null | undefined) => !!email && email.endsWith(`@${CHILD_EMAIL_DOMAIN}`);

/** Ficha da criança (children/{uid}): quem é o responsável, login e faixa etária. */
export interface ChildRecord {
  guardianId: string;
  name: string;
  username: string;
  ageGroup: string;
}

/** Lê a ficha da criança com a instância indicada (a da própria criança ou a do responsável). */
export async function readChildRecord(db: Firestore, childId: string): Promise<ChildRecord | null> {
  const snap = await getDoc(doc(db, 'children', childId));
  return snap.exists() ? (snap.data() as ChildRecord) : null;
}

/** Instância do responsável. */
export const GUARDIAN_APP = '[DEFAULT]';
/** Instância de uma criança (pelo login, que já se sabe antes de entrar). */
export const childAppName = (username: string) => `child:${username}`;

const ACTIVE_KEY = 'minelearn_active_account';

function readActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

let activeName: string | null = typeof window === 'undefined' ? null : readActive();

function appNamed(name: string): FirebaseApp {
  return getApps().find((a) => a.name === name) ?? initializeApp(config, name);
}

const firestores = new Map<string, Firestore>();
function firestoreOf(app: FirebaseApp): Firestore {
  let db = firestores.get(app.name);
  if (!db) {
    try {
      // undefined no progresso não pode derrubar a gravação
      db = initializeFirestore(app, { ignoreUndefinedProperties: true });
    } catch {
      db = getFirestore(app);
    }
    firestores.set(app.name, db);
  }
  return db;
}

/** Auth de uma instância qualquer (ex.: entrar como criança antes de ativá-la). */
export function authOf(name: string): Auth {
  return getAuth(appNamed(name));
}

/** Auth da conta ativa (null = ninguém logado neste aparelho). */
export function activeAuth(): Auth | null {
  return activeName ? authOf(activeName) : null;
}

export function dbOf(name: string): Firestore {
  return firestoreOf(appNamed(name));
}

/**
 * Instância descartável: o responsável cria a conta da criança nela sem perder a própria sessão.
 * Sem persistência (a sessão some ao chamar dispose).
 */
export function createTempAccount(): { auth: Auth; db: Firestore; dispose: () => Promise<void> } {
  const name = `temp:${crypto.randomUUID()}`;
  const app = initializeApp(config, name);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  const db = firestoreOf(app);
  return {
    auth,
    db,
    async dispose() {
      await signOut(auth).catch(() => {});
      firestores.delete(name);
      await deleteApp(app).catch(() => {});
    },
  };
}

export function activeDb(): Firestore {
  return firestoreOf(appNamed(activeName ?? GUARDIAN_APP));
}

function activeFunctions(): Functions {
  return getFunctions(appNamed(activeName ?? GUARDIAN_APP), REGION);
}

export function getActiveAccountName(): string | null {
  return activeName;
}

// ---------------------------------------------------------------------------
// Troca de conta e aviso de login/logout
// ---------------------------------------------------------------------------

type AuthListener = (user: FirebaseUser | null) => void;
const listeners = new Set<AuthListener>();
let unsubscribe: (() => void) | null = null;
let lastUser: FirebaseUser | null | undefined;

function watchActive() {
  unsubscribe?.();
  unsubscribe = null;
  const auth = activeAuth();
  if (!auth) {
    lastUser = null;
    listeners.forEach((l) => l(null));
    return;
  }
  unsubscribe = onAuthStateChanged(auth, (user) => {
    lastUser = user;
    listeners.forEach((l) => l(user));
  });
}

/** Troca a conta ativa. Sair da instância do responsável encerra a sessão dele. */
export async function setActiveAccount(name: string | null): Promise<void> {
  if (name === activeName) return;
  const previous = activeName;
  activeName = name;
  try {
    if (name) localStorage.setItem(ACTIVE_KEY, name);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* sem localStorage: vale só nesta visita */
  }
  if (previous === GUARDIAN_APP) await signOut(authOf(GUARDIAN_APP)).catch(() => {});
  if (listeners.size > 0) watchActive();
}

/** Acompanha a conta ativa: chama na hora com o usuário atual e a cada login, logout ou troca. */
export function onActiveAuthChange(listener: AuthListener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) watchActive();
  else if (lastUser !== undefined) listener(lastUser);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      unsubscribe?.();
      unsubscribe = null;
      lastUser = undefined;
    }
  };
}

/** Encerra a sessão guardada de uma instância (ex.: perfil de criança esquecido). */
export async function signOutAccount(name: string): Promise<void> {
  if (!getApps().some((a) => a.name === name)) {
    // ainda não aberta nesta visita: abre só para apagar a sessão salva
    await authOf(name).authStateReady();
  }
  await signOut(authOf(name)).catch(() => {});
}

// ---------------------------------------------------------------------------
// Cloud Functions
// ---------------------------------------------------------------------------

/**
 * Chama uma função do servidor (onCall) como a conta ativa.
 * Erros de regra (HttpsError) chegam com a mensagem escrita no servidor; o resto vira `fallback`.
 */
export async function callFunction<T>(name: string, data: unknown, fallback = 'Não deu certo. Tente de novo.'): Promise<T> {
  try {
    const result = await httpsCallable<unknown, T>(activeFunctions(), name)(data);
    return result.data;
  } catch (err) {
    const { code, message } = (err ?? {}) as { code?: string; message?: string };
    const known = code && code !== 'functions/internal' && code !== 'functions/unknown' && code !== 'functions/unavailable';
    throw new Error(known && message ? message : fallback);
  }
}
