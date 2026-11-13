import type { SupabaseClient } from '@supabase/supabase-js';
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

/**
 * Documento da conta no Supabase: tabela child_state (uma linha por criança).
 * As regras de acesso (RLS) ficam em supabase/migrations: a criança só lê e grava a própria linha.
 * Grava só se a revisão não mudou desde a leitura; se mudou (responsável zerou, outro aparelho
 * gravou), lança StoreConflictError e o store recarrega a versão do servidor.
 */
export function createSupabaseAdapter(client: SupabaseClient): StoreAdapter {
  const revisions = new Map<string, number>();
  return {
    async load(accountId) {
      const { data, error } = await client
        .from('child_state')
        .select('state, revision')
        .eq('child_id', accountId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        revisions.delete(accountId);
        return null;
      }
      revisions.set(accountId, data.revision ?? 0);
      const state: unknown = data.state;
      return isAccountDoc(state) ? state : null;
    },
    async save(accountId, doc: AccountDoc) {
      const known = revisions.get(accountId);
      if (known === undefined) {
        const { error } = await client.from('child_state').insert({ child_id: accountId, state: doc, revision: 1 });
        if (error) {
          if (error.code === '23505') throw new StoreConflictError(); // alguém criou a linha antes
          throw error;
        }
        revisions.set(accountId, 1);
        return;
      }
      const { data, error } = await client
        .from('child_state')
        .update({ state: doc, revision: known + 1, updated_at: doc.updatedAt })
        .eq('child_id', accountId)
        .eq('revision', known)
        .select('revision');
      if (error) throw error;
      if (!data || data.length === 0) throw new StoreConflictError();
      revisions.set(accountId, known + 1);
    },
  };
}
