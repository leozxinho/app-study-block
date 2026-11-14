import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MinecraftButton } from './MinecraftButton';
import { subscriptionService, useSubscription } from '../../services/subscriptionService';
import { PRODUCT, formatBRL } from '../../config/product';

const STATUS: Record<string, string> = {
  active: 'Assinatura ativa',
  trialing: 'Período de teste',
  past_due: 'Pagamento atrasado',
  unpaid: 'Pagamento pendente',
  canceled: 'Assinatura cancelada',
  incomplete: 'Pagamento não concluído',
  paused: 'Assinatura pausada',
  none: 'Sem assinatura',
};

/** Depois de pagar, o Stripe avisa o servidor em alguns segundos: confere de novo até 30 s. */
const POLL_MS = 2000;
const POLL_TRIES = 15;

/** Área dos Pais: situação da assinatura e botão para assinar (só aparece com a cobrança ligada). */
export function SubscriptionCard() {
  const info = useSubscription();
  const [params, setParams] = useSearchParams();
  const returned = params.get('assinatura');
  const [confirming, setConfirming] = useState(returned === 'ok');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Voltou do pagamento: espera o webhook ativar a assinatura
  useEffect(() => {
    if (returned !== 'ok') return;
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      void subscriptionService.refresh();
      if (tries >= POLL_TRIES) {
        clearInterval(id);
        setConfirming(false);
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [returned]);

  useEffect(() => {
    if (!confirming || !info?.active) return;
    setConfirming(false);
    params.delete('assinatura');
    setParams(params, { replace: true });
  }, [confirming, info?.active, params, setParams]);

  if (!info || !info.required) return null;

  const until = info.periodEnd ? new Date(info.periodEnd).toLocaleDateString('pt-BR') : null;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  if (info.failed) {
    return (
      <section aria-labelledby="assinatura-title" className="rounded-md p-4 border-2 bg-amber-50 border-amber-300">
        <h2 id="assinatura-title" className="font-minecraft text-sm text-gray-900 mb-1">💳 Assinatura</h2>
        <p className="font-body text-sm text-gray-800">Não deu para conferir a assinatura agora.</p>
        <MinecraftButton variant="secondary" size="sm" className="mt-3" onClick={() => void subscriptionService.refresh()}>
          🔄 Tentar de novo
        </MinecraftButton>
      </section>
    );
  }

  return (
    <section aria-labelledby="assinatura-title" className={`rounded-md p-4 border-2 ${info.active ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-300'}`}>
      <h2 id="assinatura-title" className="font-minecraft text-sm text-gray-900 mb-1">💳 Assinatura</h2>
      {confirming && !info.active ? (
        <p className="font-body text-sm text-gray-800" role="status">⏳ Confirmando o pagamento… isso leva alguns segundos.</p>
      ) : (
        <p className="font-body text-sm text-gray-800">
          {STATUS[info.status] ?? info.status}
          {until && (info.status === 'canceled' ? ` (vale até ${until})` : ` · próxima cobrança em ${until}`)}
        </p>
      )}
      {returned === 'cancelada' && !info.active && (
        <p className="font-body text-sm text-gray-700 mt-1">O pagamento não foi concluído. Você pode tentar de novo quando quiser.</p>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {!info.active && !confirming && (
          <>
            <MinecraftButton variant="gold" size="sm" disabled={busy} onClick={() => void run(() => subscriptionService.startCheckout('monthly'))}>
              {busy ? '⏳ Abrindo…' : `Assinar mensal${PRODUCT.monthlyPrice ? ` · ${formatBRL(PRODUCT.monthlyPrice)}` : ''}`}
            </MinecraftButton>
            {PRODUCT.yearlyPrice && (
              <MinecraftButton variant="secondary" size="sm" disabled={busy} onClick={() => void run(() => subscriptionService.startCheckout('yearly'))}>
                Anual · {formatBRL(PRODUCT.yearlyPrice)}
              </MinecraftButton>
            )}
          </>
        )}
        {info.status !== 'none' && (
          <MinecraftButton variant="secondary" size="sm" disabled={busy} onClick={() => void run(() => subscriptionService.openPortal())}>
            ⚙️ Gerenciar assinatura
          </MinecraftButton>
        )}
      </div>
      {error && <p role="alert" className="font-body text-sm text-red-700 mt-2">{error}</p>}
    </section>
  );
}
