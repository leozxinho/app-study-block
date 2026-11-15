import { doc, getDoc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { isAccountDoc, StoreConflictError, type AccountDoc, type StoreAdapter } from './progressStore';

export const LOCAL_DOC_PREFIX = 'minelearn_state:';

/** Documento da conta no navegador (uma chave por conta). */
export function createLocalAdapter(storage: Storage | null = typeof localStorage === 'undefined' ? null : localStorage): StoreAdapter {
  return {
    async load(accountId) {
      try {
        const raw = storage?.getItem(LOCAL_DOC_PREFIX + accountId);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isAccountDoc(parsed) ? parsed : null;
      } catch {
        return null; // valor corrompido: começa do zero em vez de travar o app
      }
    },
    async save(accountId, doc) {
      try {
        storage?.setItem(LOCAL_DOC_PREFIX + accountId, JSON.stringify(doc));
      } catch {
        // cota cheia ou sem localStorage: vale só nesta visita
      }
    },
  };
}

/** Apaga o documento local de uma conta. */
export function removeLocalDoc(accountId: string, storage: Storage = localStorage): void {
  try {
    storage.removeItem(LOCAL_DOC_PREFIX + accountId);
  } catch {
    /* sem localStorage */
  }
}

/** Linha do progresso no Firestore (coleção childState, um documento por criança). */
export interface ChildStateRecord {
  /** Documento da conta em JSON, sem a fatia "settings" (o Firestore não aceita listas dentro de listas). */
  state?: string;
  /** Ajustes que só o responsável muda (pelas Cloud Functions): liberar tudo, meta do dia, tempo de tela. */
  settings?: Record<string, unknown>;
  revision?: number;
}

/** Monta o documento da conta a partir da linha do Firestore (null = vazia ou inválida). */
export function docFromRecord(record: ChildStateRecord | undefined): AccountDoc | null {
  if (!record || typeof record.state !== 'string') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(record.state);
  } catch {
    return null;
  }
  if (!isAccountDoc(parsed)) return null;
  return { ...parsed, slices: { ...parsed.slices, settings: { ...(record.settings ?? {}) } } };
}

/**
 * Documento da conta no Firestore: childState/{id da criança}.
 * As regras (firebase/firestore.rules) deixam a criança gravar só a própria linha, só os campos
 * state/revision/updatedAt e só com a revisão + 1. Os ajustes do responsável ficam no campo
 * settings, que a criança não consegue mudar.
 * Grava só se a revisão não mudou desde a leitura; se mudou (responsável zerou, outro aparelho
 * gravou), lança StoreConflictError e o store recarrega a versão do servidor.
 */
export function createFirestoreAdapter(getDb: () => Firestore): StoreAdapter {
  const revisions = new Map<string, number>();
  return {
    async load(accountId) {
      const snap = await getDoc(doc(getDb(), 'childState', accountId));
      if (!snap.exists()) {
        revisions.delete(accountId);
        return null;
      }
      const record = snap.data() as ChildStateRecord;
      revisions.set(accountId, record.revision ?? 0);
      return docFromRecord(record);
    },
    async save(accountId, accountDoc: AccountDoc) {
      const known = revisions.get(accountId);
      const db = getDb();
      const ref = doc(db, 'childState', accountId);
      // A fatia settings é do responsável: não vai junto (o servidor guarda à parte)
      const { settings: _settings, ...slices } = accountDoc.slices;
      void _settings;
      const state = JSON.stringify({ ...accountDoc, slices });
      const next = (known ?? 0) + 1;
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists() ? ((snap.data() as ChildStateRecord).revision ?? 0) : undefined;
        if (current !== known) throw new StoreConflictError();
        const fields = { state, revision: next, updatedAt: serverTimestamp() };
        if (snap.exists()) tx.update(ref, fields);
        else tx.set(ref, fields);
      });
      revisions.set(accountId, next);
    },
  };
}
