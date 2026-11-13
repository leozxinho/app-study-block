/**
 * Store único do progresso de uma conta (criança ou visitante).
 *
 * Todo o estado de jogo da conta fica num documento só, dividido em "fatias"
 * (aventura, XP/atividades, estatísticas do jogo, ajustes). As telas leem de
 * forma síncrona da memória; a gravação vai para o adaptador da conta:
 * - visitante ou app sem Supabase: navegador (localStorage);
 * - conta logada com Supabase: tabela child_state (com gravação agrupada).
 *
 * Este arquivo não conhece Supabase nem React: recebe os adaptadores prontos.
 */

export type StoreStatus = 'loading' | 'ready' | 'error';

export interface AccountDoc {
  v: 1;
  slices: Record<string, unknown>;
  updatedAt: string;
}

/** Lançado pelo adaptador quando o documento mudou em outro lugar (ex.: responsável zerou). */
export class StoreConflictError extends Error {
  constructor() {
    super('o progresso mudou em outro aparelho');
    this.name = 'StoreConflictError';
  }
}

export interface StoreAdapter {
  load(accountId: string): Promise<AccountDoc | null>;
  save(accountId: string, doc: AccountDoc): Promise<void>;
}

export interface StoreOptions {
  /** Onde guardar o visitante e as contas quando não há servidor. */
  local: StoreAdapter;
  /** Servidor (Supabase). Ausente = tudo no navegador. */
  remote?: StoreAdapter | null;
  /** Espera antes de gravar no servidor, para juntar várias mudanças (ms). */
  remoteDelayMs?: number;
  /** Importa dados de versões antigas (uma vez) quando a conta ainda não tem documento. */
  importLegacy?: () => Record<string, unknown> | null;
  onError?: (action: string, error: unknown) => void;
}

export const GUEST_ID = 'guest';

export function emptyDoc(): AccountDoc {
  return { v: 1, slices: {}, updatedAt: new Date().toISOString() };
}

/** Aceita só documentos com o formato esperado; o resto conta como vazio. */
export function isAccountDoc(value: unknown): value is AccountDoc {
  if (!value || typeof value !== 'object') return false;
  const doc = value as Partial<AccountDoc>;
  return doc.v === 1 && !!doc.slices && typeof doc.slices === 'object' && !Array.isArray(doc.slices);
}

export function createProgressStore(options: StoreOptions) {
  const { local, remote = null, remoteDelayMs = 800, importLegacy, onError = () => {} } = options;

  let accountId = GUEST_ID;
  let doc: AccountDoc = emptyDoc();
  let status: StoreStatus = 'loading';
  /** Só grava depois de carregar com sucesso (nunca sobrescreve o servidor com um documento vazio). */
  let loaded = false;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Promise<void> | null = null;
  let version = 0;
  const listeners = new Set<() => void>();

  const adapterFor = (id: string) => (id !== GUEST_ID && remote ? remote : local);

  function notify() {
    version++;
    listeners.forEach((l) => l());
  }

  function persistNow(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!loaded) return Promise.resolve();
    const id = accountId;
    const snapshot = doc;
    const run = adapterFor(id)
      .save(id, snapshot)
      .catch((e) => {
        if (e instanceof StoreConflictError && id === accountId) {
          // Outro aparelho (ou o responsável) mudou o documento: vale o que está no servidor
          onError('salvar progresso (recarregando a versão do servidor)', e);
          accountId = '';
          return activate(id === GUEST_ID ? null : id);
        }
        onError('salvar progresso', e);
      });
    pending = run;
    return run;
  }

  function schedulePersist() {
    if (!loaded) return;
    const adapter = adapterFor(accountId);
    if (adapter === local) {
      void persistNow();
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void persistNow(), remoteDelayMs);
  }

  async function activate(id: string | null | undefined): Promise<void> {
    const nextId = id || GUEST_ID;
    if (nextId === accountId && status === 'ready') return;
    if (timer) await persistNow();
    const gen = ++generation;
    accountId = nextId;
    loaded = false;
    status = 'loading';
    doc = emptyDoc();
    notify();
    try {
      let found = await adapterFor(nextId).load(nextId);
      if (gen !== generation) return; // outra troca de conta começou no meio
      if (!isAccountDoc(found)) {
        found = emptyDoc();
        const legacy = nextId === GUEST_ID ? importLegacy?.() : null;
        if (legacy) found.slices = legacy;
        doc = found;
        loaded = true;
        status = 'ready';
        await persistNow();
      } else {
        doc = found;
        loaded = true;
        status = 'ready';
      }
    } catch (e) {
      if (gen !== generation) return;
      onError('carregar progresso', e);
      status = 'error';
    }
    notify();
  }

  return {
    /** Troca a conta ativa (null = visitante) e carrega o documento dela. */
    activate,

    /** Tenta carregar de novo depois de um erro. */
    retry(): Promise<void> {
      const id = accountId;
      accountId = '';
      return activate(id === GUEST_ID ? null : id);
    },

    getAccountId: () => accountId,
    getStatus: () => status,
    /** Muda a cada alteração (para useSyncExternalStore). */
    getVersion: () => version,

    read<T>(slice: string, fallback: T): T {
      const value = doc.slices[slice];
      return value === undefined ? fallback : (value as T);
    },

    write(slice: string, value: unknown): void {
      if (status !== 'ready') {
        onError('gravar progresso', new Error(`conta ainda não carregada (${status})`));
        return;
      }
      doc = { ...doc, slices: { ...doc.slices, [slice]: value }, updatedAt: new Date().toISOString() };
      notify();
      schedulePersist();
    },

    /** Volta a conta ativa à estaca zero. */
    resetAll(): void {
      if (status !== 'ready') return;
      doc = emptyDoc();
      notify();
      schedulePersist();
    },

    /** Grava agora o que estiver esperando (ex.: ao sair da página). */
    async flush(): Promise<void> {
      if (timer) await persistNow();
      else if (pending) await pending;
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type ProgressStore = ReturnType<typeof createProgressStore>;
