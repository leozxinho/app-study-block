import {
  createUserWithEmailAndPassword,
  getMultiFactorResolver,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  TotpMultiFactorGenerator,
  updateProfile,
  type Auth,
  type MultiFactorError,
  type MultiFactorResolver,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  activeAuth,
  authOf,
  childAppName,
  childEmail,
  dbOf,
  getActiveAccountName,
  GUARDIAN_APP,
  isChildEmail,
  isFirebaseConfigured,
  onActiveAuthChange,
  readChildRecord,
  setActiveAccount,
  signOutAccount,
} from '../lib/firebase';
import { progressStore } from '../lib/store';
import { normalizeUsername } from '../lib/family';
import { User, AgeGroup } from '../types';
import { readJSON, writeJSON } from '../lib/storage';
import { checkGuardianPassword, createGuardian, findGuardian, findOrCreateGuardian, hashPassword, readFamily, type DemoGuardian } from './familyDemo';
import { forgetProfile, listSavedProfiles, saveProfile, updateProfileSkin, type SavedProfile } from './savedProfiles';

// Contas: o responsável entra com e-mail ou Google; a criança entra com login e senha
// criados pelo responsável. Ao trocar de conta, o progresso da conta certa é carregado.

const LOCAL_AUTH_KEY = 'minecraft_edu_auth';
const AGE_KEY = 'minecraft_edu_age_group';

/** Lembra a criança neste aparelho (a sessão dela fica na instância própria do Firebase). */
function rememberChild(user: User): void {
  const game = progressStore.read<{ skin?: Record<string, string> }>('game', {});
  saveProfile({
    id: user.id,
    name: user.name,
    username: user.username ?? '',
    ageGroup: user.age_group,
    skin: game?.skin,
  });
}

/** Instância do Firebase em que cada conta vive (ver src/lib/firebase.ts). */
function appNameFor(user: FirebaseUser): string {
  return isChildEmail(user.email) ? childAppName(user.email!.split('@')[0]) : GUARDIAN_APP;
}

/**
 * Usuário do app a partir do Firebase. Conta de criança = e-mail no domínio interno
 * (só o responsável cria, na Área dos Pais); nome e faixa etária vêm da ficha children/{uid}.
 * Quem libera o quê é o firebase/firestore.rules, não esta função.
 */
async function fromFirebase(user: FirebaseUser): Promise<User> {
  const isChild = isChildEmail(user.email);
  const record = isChild ? await readChildRecord(dbOf(appNameFor(user)), user.uid).catch(() => null) : null;
  return {
    id: user.uid,
    name: user.displayName || record?.name || '',
    email: isChild ? '' : user.email || '',
    role: isChild ? 'student' : 'parent',
    created_at: user.metadata.creationTime ? new Date(user.metadata.creationTime).toISOString() : '',
    username: isChild ? (record?.username ?? user.email!.split('@')[0]) : undefined,
    age_group: isChild ? (record?.ageGroup as AgeGroup | undefined) : undefined,
  };
}

/** Carrega o progresso da conta: criança tem o próprio; responsável joga como visitante. */
async function switchAccount(user: User | null): Promise<User | null> {
  if (user?.role === 'student' && user.age_group) {
    try {
      localStorage.setItem(AGE_KEY, user.age_group);
    } catch {
      /* sem localStorage */
    }
  }
  await progressStore.activate(user?.role === 'student' ? user.id : null);
  return user;
}

/** Responsável local como usuário da sessão (sem o hash da senha). */
function guardianUser(g: DemoGuardian): User {
  return { id: g.id, name: g.name, email: g.email, created_at: g.created_at, role: 'parent' };
}

function saveDemoSession(user: User): User {
  writeJSON(LOCAL_AUTH_KEY, user);
  return user;
}

/** A conta tem verificação em duas etapas: falta o código do app autenticador (ver completeTwoFactor). */
export class TwoFactorRequiredError extends Error {
  constructor(readonly resolver: MultiFactorResolver) {
    super('Digite o código do app autenticador.');
    this.name = 'TwoFactorRequiredError';
  }
}

/** Troca o erro "falta o 2º fator" do Firebase por TwoFactorRequiredError; os outros seguem iguais. */
function rethrowTwoFactor(auth: Auth, err: unknown): never {
  if ((err as { code?: string })?.code === 'auth/multi-factor-auth-required') {
    throw new TwoFactorRequiredError(getMultiFactorResolver(auth, err as MultiFactorError));
  }
  throw err;
}

/** Erro com a mesma mensagem do modo local, para a tela mostrar "Login ou senha incorretos". */
const invalidLogin = () => new Error('Invalid login credentials');

let started = false;

export const authService = {
  /** Chamar uma vez ao abrir o app: carrega a conta da sessão salva e acompanha login/logout. */
  start(): void {
    if (started) return;
    started = true;
    if (!isFirebaseConfigured()) {
      void this.getCurrentUser().then(switchAccount);
      return;
    }
    // Chama na hora com a conta salva e depois a cada login, logout ou troca de conta
    onActiveAuthChange((user) => {
      void (user ? fromFirebase(user) : Promise.resolve(null)).then(switchAccount);
    });
  },

  /** Cria a conta do responsável (já entra; o e-mail de confirmação vai em seguida). */
  async signUp(email: string, password: string, name: string): Promise<User | null> {
    if (!isFirebaseConfigured()) {
      const guardian = await createGuardian(email, name, password);
      return switchAccount(saveDemoSession(guardianUser(guardian)));
    }

    const { user } = await createUserWithEmailAndPassword(authOf(GUARDIAN_APP), email, password);
    await updateProfile(user, { displayName: name });
    await sendEmailVerification(user, { url: `${window.location.origin}${import.meta.env.BASE_URL}responsavel` }).catch(() => {});
    await setActiveAccount(GUARDIAN_APP);
    return switchAccount(await fromFirebase(user));
  },

  /**
   * Entrar com Google.
   * Com Firebase: abre a janela do Google (o provedor Google precisa estar ativo em
   * Authentication > Sign-in method). Se o navegador bloquear a janela, vai para o Google e volta.
   * Sem Firebase (modo demonstração): cria um responsável de teste na hora.
   */
  async signInWithGoogle(): Promise<{ redirected: boolean }> {
    if (!isFirebaseConfigured()) {
      const guardian = findOrCreateGuardian('demo@gmail.com', 'Conta Google (demonstração)');
      await switchAccount(saveDemoSession({ ...guardian, role: 'parent' }));
      return { redirected: false };
    }
    const auth = authOf(GUARDIAN_APP);
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      await setActiveAccount(GUARDIAN_APP);
      await switchAccount(await fromFirebase(user));
      return { redirected: false };
    } catch (err) {
      if ((err as { code?: string })?.code !== 'auth/popup-blocked') rethrowTwoFactor(auth, err);
      await setActiveAccount(GUARDIAN_APP); // na volta do Google, a sessão aparece nesta instância
      await signInWithRedirect(auth, provider);
      return { redirected: true };
    }
  },

  /** Responsável entra com e-mail e senha. */
  async signIn(email: string, password: string): Promise<User | null> {
    if (!isFirebaseConfigured()) {
      // Modo local: a conta e a senha ficam neste navegador
      const found = findGuardian(email);
      if (!found || !(await checkGuardianPassword(found, password))) throw invalidLogin();
      return switchAccount(saveDemoSession(guardianUser(found)));
    }

    const auth = authOf(GUARDIAN_APP);
    let user: FirebaseUser;
    try {
      ({ user } = await signInWithEmailAndPassword(auth, email, password));
    } catch (err) {
      rethrowTwoFactor(auth, err);
    }
    await setActiveAccount(GUARDIAN_APP);
    return switchAccount(await fromFirebase(user));
  },

  /** 2º passo do login com 2FA: confere o código de 6 dígitos do app autenticador. */
  async completeTwoFactor(resolver: MultiFactorResolver, code: string): Promise<User | null> {
    const hint = resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!hint) throw new Error('Esta conta usa um tipo de verificação que o app ainda não aceita.');
    const { user } = await resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim()));
    await setActiveAccount(GUARDIAN_APP);
    return switchAccount(await fromFirebase(user));
  },

  /** Criança entra com o login e a senha que o responsável criou. */
  async signInChild(username: string, password: string): Promise<User> {
    const login = normalizeUsername(username);
    if (!isFirebaseConfigured()) {
      const child = readFamily().children.find((c) => c.username === login);
      if (!child || child.passwordHash !== (await hashPassword(password, child.id))) {
        throw invalidLogin();
      }
      const user: User = {
        id: child.id,
        name: child.name,
        email: '',
        role: 'student',
        created_at: child.created_at,
        username: child.username,
        age_group: child.ageGroup as AgeGroup,
      };
      await switchAccount(saveDemoSession(user));
      rememberChild(user);
      return user;
    }

    // Entra na instância da criança antes de ativá-la: se a senha errar, a conta atual continua
    const name = childAppName(login);
    const auth = authOf(name);
    const { user: fbUser } = await signInWithEmailAndPassword(auth, childEmail(login), password);
    const user = await fromFirebase(fbUser);
    if (user.role !== 'student') {
      await signOut(auth);
      throw invalidLogin();
    }
    await setActiveAccount(name);
    await switchAccount(user);
    rememberChild(user);
    return user;
  },

  /** Entra num perfil de criança lembrado neste aparelho (sem senha). */
  async signInSaved(profile: SavedProfile): Promise<User> {
    if (!isFirebaseConfigured()) {
      const user: User = {
        id: profile.id,
        name: profile.name,
        email: '',
        role: 'student',
        created_at: '',
        username: profile.username,
        age_group: profile.ageGroup as AgeGroup | undefined,
      };
      // a criança precisa existir ainda na família deste aparelho
      if (!readFamily().children.some((c) => c.id === profile.id)) {
        forgetProfile(profile.id);
        throw new Error('Esse perfil não existe mais.');
      }
      await switchAccount(saveDemoSession(user));
      saveProfile({ ...profile });
      return user;
    }
    if (!profile.username) throw new Error('Entre com o login e a senha uma vez.');
    const name = childAppName(profile.username);
    const auth = authOf(name);
    await auth.authStateReady();
    const fbUser = auth.currentUser;
    if (!fbUser || fbUser.uid !== profile.id) throw new Error('Esse acesso venceu. Entre com o login e a senha de novo.');
    let user: User;
    try {
      user = await fromFirebase(fbUser); // renova o token: falha se a conta foi apagada ou desativada
    } catch {
      await signOut(auth).catch(() => {});
      throw new Error('Esse acesso venceu. Entre com o login e a senha de novo.');
    }
    await setActiveAccount(name);
    await switchAccount(user);
    rememberChild(user);
    return user;
  },

  /** Esquece um perfil de criança neste aparelho (e apaga a sessão guardada dele). */
  async forgetSavedProfile(profile: SavedProfile): Promise<void> {
    forgetProfile(profile.id);
    if (!isFirebaseConfigured() || !profile.username) return;
    const name = childAppName(profile.username);
    if (getActiveAccountName() !== name) await signOutAccount(name);
  },

  async signOut() {
    await progressStore.flush();
    const current = await this.getCurrentUser();
    if (current?.role === 'student') {
      // guarda a roupa atual para o botão do perfil
      const game = progressStore.read<{ skin?: Record<string, string> }>('game', {});
      if (game?.skin) updateProfileSkin(current.id, game.skin);
    }
    if (!isFirebaseConfigured()) {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      await switchAccount(null);
      return;
    }
    const remembered = current?.role === 'student' && listSavedProfiles().some((p) => p.id === current.id);
    // Perfil lembrado: a sessão da criança fica guardada na instância dela, para entrar
    // de novo tocando no personagem. Qualquer outra conta sai de verdade.
    const auth = activeAuth();
    if (auth && !remembered) await signOut(auth).catch(() => {});
    await setActiveAccount(null);
    await switchAccount(null);
  },

  /** E-mail do responsável confirmado? (Google já vem confirmado; modo local não confere.) */
  async isEmailVerified(): Promise<boolean> {
    if (!isFirebaseConfigured()) return true;
    const user = activeAuth()?.currentUser;
    return !!user && (user.emailVerified || isChildEmail(user.email));
  },

  /** Reenvia o link de confirmação para o e-mail do responsável. */
  async resendVerification(): Promise<void> {
    const user = activeAuth()?.currentUser;
    if (!user) throw new Error('Entre na conta do responsável.');
    await sendEmailVerification(user, { url: `${window.location.origin}${import.meta.env.BASE_URL}responsavel` });
  },

  /**
   * Depois de clicar no link: busca o estado novo no Firebase e renova o token
   * (as regras do banco leem email_verified do token). Devolve se já está confirmado.
   */
  async refreshVerification(): Promise<boolean> {
    const user = activeAuth()?.currentUser;
    if (!user) return false;
    await user.reload();
    if (user.emailVerified) await user.getIdToken(true);
    return user.emailVerified;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!isFirebaseConfigured()) {
      const saved = readJSON<User | null>(LOCAL_AUTH_KEY, null);
      // Sessões antigas (antes das contas de família) eram de professor/responsável
      return saved && saved.role !== 'student' ? { ...saved, role: 'parent' } : saved;
    }

    const auth = activeAuth();
    if (!auth) return null;
    await auth.authStateReady();
    return auth.currentUser ? fromFirebase(auth.currentUser) : null;
  },
};
