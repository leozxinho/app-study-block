import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createProgressStore,
  emptyDoc,
  StoreConflictError,
  GUEST_ID,
  type AccountDoc,
  type StoreAdapter,
} from '../../src/lib/store/progressStore.ts';

/** Adaptador em memória que registra as gravações. */
function memoryAdapter(initial: Record<string, AccountDoc> = {}) {
  const docs = new Map(Object.entries(initial));
  const saves: string[] = [];
  let failLoad = false;
  let conflictOnce = false;
  const adapter: StoreAdapter = {
    async load(id) {
      if (failLoad) throw new Error('offline');
      return docs.get(id) ?? null;
    },
    async save(id, doc) {
      if (conflictOnce) {
        conflictOnce = false;
        throw new StoreConflictError();
      }
      saves.push(id);
      docs.set(id, doc);
    },
  };
  return {
    adapter,
    docs,
    saves,
    setFailLoad: (v: boolean) => (failLoad = v),
    conflictNextSave: () => (conflictOnce = true),
  };
}

const docWith = (slices: Record<string, unknown>): AccountDoc => ({ ...emptyDoc(), slices });

test('visitante carrega do adaptador local e grava na hora', async () => {
  const local = memoryAdapter({ [GUEST_ID]: docWith({ progress: { xp: 30 } }) });
  const store = createProgressStore({ local: local.adapter });
  await store.activate(null);
  assert.equal(store.getStatus(), 'ready');
  assert.deepEqual(store.read('progress', null), { xp: 30 });
  store.write('progress', { xp: 40 });
  await store.flush();
  assert.deepEqual(local.docs.get(GUEST_ID)?.slices.progress, { xp: 40 });
});

test('conta logada usa o servidor, não o navegador, e agrupa gravações', async () => {
  const local = memoryAdapter();
  const remote = memoryAdapter({ kid: docWith({ progress: { xp: 5 } }) });
  const store = createProgressStore({ local: local.adapter, remote: remote.adapter, remoteDelayMs: 10_000 });
  await store.activate('kid');
  assert.deepEqual(store.read('progress', null), { xp: 5 });
  store.write('progress', { xp: 6 });
  store.write('progress', { xp: 7 });
  assert.equal(remote.saves.length, 0, 'espera o atraso antes de gravar');
  await store.flush();
  assert.deepEqual(remote.saves, ['kid'], 'duas mudanças viram uma gravação');
  assert.deepEqual(remote.docs.get('kid')?.slices.progress, { xp: 7 });
  assert.equal(local.docs.has('kid'), false);
});

test('erro ao carregar não grava nada por cima (não apaga o progresso do servidor)', async () => {
  const remote = memoryAdapter({ kid: docWith({ progress: { xp: 99 } }) });
  remote.setFailLoad(true);
  const errors: string[] = [];
  const store = createProgressStore({ local: memoryAdapter().adapter, remote: remote.adapter, onError: (a) => errors.push(a) });
  await store.activate('kid');
  assert.equal(store.getStatus(), 'error');
  store.write('progress', { xp: 0 });
  await store.flush();
  assert.equal(remote.saves.length, 0);
  assert.deepEqual(remote.docs.get('kid')?.slices.progress, { xp: 99 });
  remote.setFailLoad(false);
  await store.retry();
  assert.equal(store.getStatus(), 'ready');
  assert.deepEqual(store.read('progress', null), { xp: 99 });
});

test('trocar de conta grava o pendente da conta anterior e carrega a nova', async () => {
  const remote = memoryAdapter({ a: docWith({ n: 1 }), b: docWith({ n: 2 }) });
  const store = createProgressStore({ local: memoryAdapter().adapter, remote: remote.adapter, remoteDelayMs: 10_000 });
  await store.activate('a');
  store.write('n', 10);
  await store.activate('b');
  assert.equal(remote.docs.get('a')?.slices.n, 10);
  assert.equal(store.read('n', 0), 2);
  assert.equal(store.getAccountId(), 'b');
});

test('conflito (responsável zerou) recarrega a versão do servidor', async () => {
  const remote = memoryAdapter({ kid: docWith({ progress: { xp: 50 } }) });
  const store = createProgressStore({ local: memoryAdapter().adapter, remote: remote.adapter, remoteDelayMs: 0, onError: () => {} });
  await store.activate('kid');
  remote.docs.set('kid', emptyDoc()); // zerado no servidor
  remote.conflictNextSave();
  store.write('progress', { xp: 60 });
  await store.flush();
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(store.getStatus(), 'ready');
  assert.deepEqual(store.read('progress', null), null, 'vale o documento zerado');
});

test('resetAll volta a conta à estaca zero', async () => {
  const local = memoryAdapter({ [GUEST_ID]: docWith({ progress: { xp: 30 }, game: { owned: ['hat:x'] } }) });
  const store = createProgressStore({ local: local.adapter });
  await store.activate(null);
  store.resetAll();
  await store.flush();
  assert.deepEqual(local.docs.get(GUEST_ID)?.slices, {});
});

test('documento estranho no adaptador conta como vazio', async () => {
  const local = memoryAdapter({ [GUEST_ID]: { v: 2, slices: [] } as unknown as AccountDoc });
  const store = createProgressStore({ local: local.adapter });
  await store.activate(null);
  assert.equal(store.read('progress', 'nada'), 'nada');
});
