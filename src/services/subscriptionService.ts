/**
 * Assinatura do responsável (Stripe). Só vale com Supabase conectado e
 * VITE_REQUIRE_SUBSCRIPTION=true; sem isso o jogo fica liberado (modo demonstração/testes).
 */
import { useEffect, useSyncExternalStore } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused';

export interface SubscriptionInfo {
  /** Pode jogar? */
  active: boolean;
  required: boolean;
  status: SubscriptionStatus;
  periodEnd: string | null;
  /** Não deu para consultar (sem internet, servidor fora). O jogo fica bloqueado até conseguir. */
  failed?: boolean;
}

export function isSubscriptionRequired(): boolean {
  return isSupabaseConfigured() && import.meta.env.VITE_REQUIRE_SUBSCRIPTION === 'true';
}

const FREE: SubscriptionInfo = { active: true, required: false, status: 'active', periodEnd: null };
const FAILED: SubscriptionInfo = { active: false, required: true, status: 'none', periodEnd: null, failed: true };

/** Lê a mensagem de erro que a Edge Function devolveu (em vez do erro genérico do supabase-js). */
async function functionError(error: unknown, fallback: string): Promise<Error> {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json();
      if (typeof body?.error === 'string') return new Error(body.error);
    } catch {
      /* corpo sem JSON */
    }
  }
  return new Error(fallback);
}

// Estado compartilhado: todas as telas veem a mesma assinatura e ela recarrega ao entrar/sair da conta.
let current: SubscriptionInfo | null = isSubscriptionRequired() ? null : FREE;
let lastUserId: string | null | undefined;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(info: SubscriptionInfo | null) {
  current = info;
  listeners.forEach((l) => l());
}

export const subscriptionService = {
  /** Assinatura do responsável logado (ou do responsável da criança logada). */
  async getStatus(): Promise<SubscriptionInfo> {
    if (!isSubscriptionRequired()) return FREE;
    const { data, error } = await supabase.from('subscriptions').select('status, current_period_end').limit(1).maybeSingle();
    if (error) throw error;
    const status = (data?.status ?? 'none') as SubscriptionStatus;
    const periodEnd = data?.current_period_end ?? null;
    // Pago, em teste, ou cancelado mas ainda dentro do período já pago
    const active = status === 'active' || status === 'trialing' || (status === 'canceled' && !!periodEnd && new Date(periodEnd) > new Date());
    return { active, required: true, status, periodEnd };
  },

  /** Consulta de novo e avisa as telas. */
  refresh(): Promise<void> {
    if (!isSubscriptionRequired()) return Promise.resolve();
    loading ??= this.getStatus()
      .then(set, () => set(FAILED))
      .finally(() => {
        loading = null;
      });
    return loading;
  },

  /** Abre o pagamento do Stripe (mensal ou anual). */
  async startCheckout(plan: 'monthly' | 'yearly' = 'monthly'): Promise<void> {
    const { data, error } = await supabase.functions.invoke('create-checkout', { body: { plan } });
    if (error || !data?.url) throw await functionError(error, 'Não foi possível abrir o pagamento. Tente de novo.');
    window.location.assign(data.url as string);
  },

  /** Abre o portal do Stripe (trocar cartão, ver faturas, cancelar). */
  async openPortal(): Promise<void> {
    const { data, error } = await supabase.functions.invoke('customer-portal', { body: {} });
    if (error || !data?.url) throw await functionError(error, 'Não foi possível abrir a assinatura. Tente de novo.');
    window.location.assign(data.url as string);
  },
};

let watching = false;
function watchAuth() {
  if (watching || !isSubscriptionRequired()) return;
  watching = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    const id = session?.user?.id ?? null;
    if (id === lastUserId) return;
    lastUserId = id;
    set(null);
    void subscriptionService.refresh();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Estado da assinatura para as telas (null = carregando). */
export function useSubscription(): SubscriptionInfo | null {
  const info = useSyncExternalStore(subscribe, () => current);
  useEffect(() => {
    watchAuth();
    if (current === null) void subscriptionService.refresh();
  }, []);
  return info;
}
