/**
 * Assinatura do responsável (Stripe). Só vale com Firebase conectado e
 * VITE_REQUIRE_SUBSCRIPTION=true; sem isso o jogo fica liberado (modo demonstração/testes).
 */
import { useEffect, useSyncExternalStore } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { activeAuth, activeDb, callFunction, isChildEmail, isFirebaseConfigured, onActiveAuthChange, readChildRecord } from '../lib/firebase';

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
  return isFirebaseConfigured() && import.meta.env.VITE_REQUIRE_SUBSCRIPTION === 'true';
}

const FREE: SubscriptionInfo = { active: true, required: false, status: 'active', periodEnd: null };
const FAILED: SubscriptionInfo = { active: false, required: true, status: 'none', periodEnd: null, failed: true };

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
    const user = activeAuth()?.currentUser;
    if (!user) return { active: false, required: true, status: 'none', periodEnd: null };
    // A criança lê a assinatura do responsável dela (guardianId da ficha children/{uid})
    const guardianId = isChildEmail(user.email) ? (await readChildRecord(activeDb(), user.uid))?.guardianId : user.uid;
    if (!guardianId) return { active: false, required: true, status: 'none', periodEnd: null };
    const snap = await getDoc(doc(activeDb(), 'subscriptions', guardianId));
    const data = snap.data() as { status?: string; currentPeriodEnd?: { toDate(): Date } | null } | undefined;
    const status = (data?.status ?? 'none') as SubscriptionStatus;
    const periodEnd = data?.currentPeriodEnd ? data.currentPeriodEnd.toDate().toISOString() : null;
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
    const fallback = 'Não foi possível abrir o pagamento. Tente de novo.';
    const { url } = await callFunction<{ url?: string }>('createCheckout', { plan }, fallback);
    if (!url) throw new Error(fallback);
    window.location.assign(url);
  },

  /** Abre o portal do Stripe (trocar cartão, ver faturas, cancelar). */
  async openPortal(): Promise<void> {
    const fallback = 'Não foi possível abrir a assinatura. Tente de novo.';
    const { url } = await callFunction<{ url?: string }>('customerPortal', {}, fallback);
    if (!url) throw new Error(fallback);
    window.location.assign(url);
  },
};

let watching = false;
function watchAuth() {
  if (watching || !isSubscriptionRequired()) return;
  watching = true;
  onActiveAuthChange((user) => {
    const id = user?.uid ?? null;
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
