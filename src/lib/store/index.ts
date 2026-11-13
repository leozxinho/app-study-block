import { useSyncExternalStore } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { createProgressStore, type StoreStatus } from './progressStore';
import { createLocalAdapter, createSupabaseAdapter } from './adapters';
import { importLegacyKeys } from './legacy';

/** Store do progresso da conta ativa (uma instância para o app inteiro). */
export const progressStore = createProgressStore({
  local: createLocalAdapter(),
  remote: isSupabaseConfigured() ? createSupabaseAdapter(supabase) : null,
  importLegacy: () => importLegacyKeys(localStorage, localStorage.getItem('minecraft_edu_age_group') || 'maternal'),
  onError: (action, error) => console.error(`[progresso] erro ao ${action}:`, error),
});

// Não perde a última jogada se a aba fechar antes da gravação agrupada
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => void progressStore.flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void progressStore.flush();
  });
}

/** Re-renderiza quando o progresso muda; devolve a versão atual. */
export function useProgressVersion(): number {
  return useSyncExternalStore(progressStore.subscribe, progressStore.getVersion, progressStore.getVersion);
}

export function useStoreStatus(): { status: StoreStatus; accountId: string } {
  useProgressVersion();
  return { status: progressStore.getStatus(), accountId: progressStore.getAccountId() };
}

export { GUEST_ID } from './progressStore';
