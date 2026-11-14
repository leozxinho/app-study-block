import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MinecraftButton } from './MinecraftButton';
import { BlockLoader } from './BlockLoader';
import { subscriptionService, useSubscription } from '../../services/subscriptionService';
import { stopSpeaking } from '../../lib/voice';

/** Telas de jogar: precisam de assinatura ativa (a Área dos Pais, o login e a /conheca ficam livres). */
const GATED = ['/adventure', '/activity', '/activities', '/album', '/casa', '/loja', '/relampago', '/treino', '/dashboard', '/world'];

/**
 * Bloqueia as telas de jogar quando a assinatura não está ativa (mesmo abrindo pela URL).
 * Sem cobrança ligada (VITE_REQUIRE_SUBSCRIPTION) não faz nada.
 */
export function SubscriptionGuard() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const info = useSubscription();
  const gated = GATED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const blocked = gated && (!info || !info.active);

  useEffect(() => {
    if (blocked) stopSpeaking();
  }, [blocked]);

  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-indigo-950/95 px-4" role="dialog" aria-modal="true" aria-labelledby="sub-guard-title">
      {!info ? (
        <BlockLoader dark />
      ) : (
        <div className="max-w-sm w-full text-center text-white space-y-4">
          <div className="text-6xl" aria-hidden="true">{info.failed ? '📡' : '🔒'}</div>
          <h2 id="sub-guard-title" className="font-minecraft text-lg text-minecraft-gold">
            {info.failed ? 'Sem conexão' : 'Assinatura vencida'}
          </h2>
          <p className="font-body text-base">
            {info.failed
              ? 'Não deu para conferir a assinatura. Veja se a internet está ligada e tente de novo.'
              : 'Peça para o seu responsável renovar a assinatura na Área dos Pais.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {info.failed && (
              <MinecraftButton variant="gold" size="sm" onClick={() => void subscriptionService.refresh()}>
                🔄 Tentar de novo
              </MinecraftButton>
            )}
            <MinecraftButton variant="secondary" size="sm" onClick={() => navigate('/inicio')}>
              Voltar ao início
            </MinecraftButton>
          </div>
        </div>
      )}
    </div>
  );
}
