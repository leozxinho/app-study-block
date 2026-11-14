import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { progressStore } from '../lib/store';
import { normalizeUsername } from '../lib/family';
import { User, AgeGroup } from '../types';
import { readJSON, writeJSON } from '../lib/storage';
import { checkGuardianPassword, createGuardian, findGuardian, findOrCreateGuardian, hashPassword, readFamily, type DemoGuardian } from './familyDemo';
import { forgetProfile, listSavedProfiles, saveProfile, updateProfileSkin, type SavedProfile } from './savedProfiles';
import type { Session } from '@supabase/supabase-js';

/** Lembra a criança neste aparelho (e a sessão dela, no Supabase). */
function rememberChild(user: User, session?: Session | null): void {
  const game = progressStore.read<{ skin?: Record<string, string> }>('game', {});
  saveProfile({
    id: user.id,
    name: user.name,
    username: user.username ?? '',
    ageGroup: user.age_group,
    skin: game?.skin,
    session: session ? { access_token: session.access_token, refresh_token: session.refresh_token } : undefined,
  });
}
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

/** Responsável local como usuário da sessão (sem o hash da senha). */
function guardianUser(g: DemoGuardian): User {
  return { id: g.id, name: g.name, email: g.email, created_at: g.created_at, role: 'parent' };
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
      const guardian = await createGuardian(email, name, password);
      return switchAccount(saveDemoSession(guardianUser(guardian)));
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
      // Modo local: a conta e a senha ficam neste navegador
      const found = findGuardian(email);
      if (!found || !(await checkGuardianPassword(found, password))) throw new Error('Invalid login credentials');
      return switchAccount(saveDemoSession(guardianUser(found)));
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
      rememberChild(user);
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
    rememberChild(user, data.session);
    return user;
  },

  /** Entra num perfil de criança lembrado neste aparelho (sem senha). */
  async signInSaved(profile: SavedProfile): Promise<User> {
    const user: User = {
      id: profile.id,
      name: profile.name,
      email: '',
      role: 'student',
      created_at: '',
      username: profile.username,
      age_group: profile.ageGroup as AgeGroup | undefined,
    };
    if (!isSupabaseConfigured()) {
      // a criança precisa existir ainda na família deste aparelho
      if (!readFamily().children.some((c) => c.id === profile.id)) {
        forgetProfile(profile.id);
        throw new Error('Esse perfil não existe mais.');
      }
      await switchAccount(saveDemoSession(user));
      saveProfile({ ...profile });
      return user;
    }
    if (!profile.session) throw new Error('Entre com o login e a senha uma vez.');
    const { data, error } = await supabase.auth.setSession(profile.session);
    if (error || !data.user) {
      saveProfile({ ...profile, session: undefined });
      throw new Error('Esse acesso venceu. Entre com o login e a senha de novo.');
    }
    const real = fromSupabase(data.user);
    await switchAccount(real);
    rememberChild(real, data.session);
    return real;
  },

  async signOut() {
    await progressStore.flush();
    const current = await this.getCurrentUser();
    if (current?.role === 'student') {
      // guarda a roupa atual para o botão do perfil
      const game = progressStore.read<{ skin?: Record<string, string> }>('game', {});
      if (game?.skin) updateProfileSkin(current.id, game.skin);
    }
    if (isSupabaseConfigured() && current?.role === 'student' && listSavedProfiles().some((p) => p.id === current.id)) {
      // Perfil lembrado: guarda a sessão atual e limpa só este aparelho (sem invalidar no servidor),
      // para a criança entrar de novo tocando no personagem.
      const { data } = await supabase.auth.getSession();
      if (data.session) rememberChild(current, data.session);
      Object.keys(localStorage).filter((k) => k.startsWith('sb-')).forEach((k) => localStorage.removeItem(k));
      window.location.assign('/');
      return;
    }
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
