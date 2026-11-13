import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { progressStore } from '../lib/store';
import { normalizeUsername } from '../lib/family';
import { User, AgeGroup } from '../types';
import { readJSON, writeJSON } from '../lib/storage';
import { findOrCreateGuardian, hashPassword, readFamily } from './familyDemo';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Contas: o responsável entra com e-mail ou Google; a criança entra com login e senha
// criados pelo responsável. Ao trocar de conta, o progresso da conta certa é carregado.

const LOCAL_AUTH_KEY = 'minecraft_edu_auth';
const AGE_KEY = 'minecraft_edu_age_group';
/** Domínio interno do e-mail das contas de criança (nenhum e-mail é enviado). Igual ao da Edge Function. */
const CHILD_EMAIL_DOMAIN = import.meta.env.VITE_CHILD_EMAIL_DOMAIN || 'crianca.minelearn.app';

function fromSupabase(user: SupabaseUser): User {
  // Papel de criança vem do app_metadata (só o servidor altera); o resto é responsável
  const isChild = user.app_metadata?.role === 'student';
  return {
    id: user.id,
    name: user.user_metadata?.name || user.user_metadata?.full_name || '',
    email: isChild ? '' : user.email || '',
    role: isChild ? 'student' : 'parent',
    created_at: user.created_at,
    username: isChild ? user.user_metadata?.username : undefined,
    age_group: isChild ? user.user_metadata?.age_group : undefined,
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

function saveDemoSession(user: User): User {
  writeJSON(LOCAL_AUTH_KEY, user);
  return user;
}

let started = false;

export const authService = {
  /** Chamar uma vez ao abrir o app: carrega a conta da sessão salva e acompanha login/logout. */
  start(): void {
    if (started) return;
    started = true;
    void this.getCurrentUser().then(switchAccount);
    if (isSupabaseConfigured()) {
      supabase.auth.onAuthStateChange((_event, session) => {
        void switchAccount(session?.user ? fromSupabase(session.user) : null);
      });
    }
  },

  /** Cria a conta do responsável. */
  async signUp(email: string, password: string, name: string) {
    if (!isSupabaseConfigured()) {
      const guardian = findOrCreateGuardian(email, name);
      return switchAccount(saveDemoSession({ ...guardian, role: 'parent' }));
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'parent' }, emailRedirectTo: `${window.location.origin}/inicio` },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Entrar com Google.
   * Com Supabase: abre o Google (OAuth) e volta para /inicio (o provedor Google precisa estar ativo no painel do Supabase).
   * Sem Supabase (modo demonstração): cria um responsável de teste na hora.
   */
  async signInWithGoogle(): Promise<{ redirected: boolean }> {
    if (!isSupabaseConfigured()) {
      const guardian = findOrCreateGuardian('demo@gmail.com', 'Conta Google (demonstração)');
      await switchAccount(saveDemoSession({ ...guardian, role: 'parent' }));
      return { redirected: false };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/inicio` },
    });
    if (error) throw error;
    return { redirected: true };
  },

  /** Responsável entra com e-mail e senha. */
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      // Demonstração: qualquer senha serve para o responsável
      const guardian = findOrCreateGuardian(email, '');
      return switchAccount(saveDemoSession({ ...guardian, role: 'parent' }));
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return switchAccount(fromSupabase(data.user));
  },

  /** Criança entra com o login e a senha que o responsável criou. */
  async signInChild(username: string, password: string): Promise<User> {
    const login = normalizeUsername(username);
    if (!isSupabaseConfigured()) {
      const child = readFamily().children.find((c) => c.username === login);
      if (!child || child.passwordHash !== (await hashPassword(password, child.id))) {
        throw new Error('Invalid login credentials');
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
      return user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${login}@${CHILD_EMAIL_DOMAIN}`,
      password,
    });
    if (error) throw error;
    const user = fromSupabase(data.user);
    if (user.role !== 'student') {
      await supabase.auth.signOut();
      throw new Error('Invalid login credentials');
    }
    await switchAccount(user);
    return user;
  },

  async signOut() {
    await progressStore.flush();
    if (!isSupabaseConfigured()) {
      localStorage.removeItem(LOCAL_AUTH_KEY);
    } else {
      await supabase.auth.signOut();
    }
    await switchAccount(null);
  },

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      const saved = readJSON<User | null>(LOCAL_AUTH_KEY, null);
      // Sessões antigas (antes das contas de família) eram de professor/responsável
      return saved && saved.role !== 'student' ? { ...saved, role: 'parent' } : saved;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user ? fromSupabase(user) : null;
  },
};
