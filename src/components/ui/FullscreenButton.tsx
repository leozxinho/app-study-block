import { useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { canFullscreen, isInstalledApp, isIOS, toggleFullscreen, useIsFullscreen } from '../../lib/fullscreen';
import { Modal } from './Modal';

/**
 * Liga/desliga a tela cheia. No iPhone (sem tela cheia no navegador), explica como instalar o app.
 * Some quando não faz sentido (app já instalado sem suporte, computador sem a API).
 */
export function FullscreenButton({ className = '' }: { className?: string }) {
  const full = useIsFullscreen();
  const [tip, setTip] = useState(false);
  const supported = canFullscreen();
  const showTip = !supported && isIOS() && !isInstalledApp();
  if (!supported && !showTip) return null;

  const label = full ? 'Sair da tela cheia' : 'Tela cheia';
  return (
    <>
      <button
        type="button"
        onClick={() => (supported ? void toggleFullscreen() : setTip(true))}
        aria-pressed={full}
        aria-label={label}
        title={label}
        className={`w-11 h-11 flex items-center justify-center rounded-md bg-black/25 text-white hover:bg-black/40
          focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis ${className}`}
      >
        {full ? <Minimize size={22} aria-hidden="true" /> : <Maximize size={22} aria-hidden="true" />}
      </button>
      {showTip && (
        <Modal open={tip} onClose={() => setTip(false)} title="Tela cheia no iPhone">
          <div className="p-5 space-y-3 font-body text-gray-900 text-sm">
            <p>No iPhone, a tela cheia funciona com o app instalado:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima).
              </li>
              <li>
                Escolha <strong>Adicionar à Tela de Início</strong>.
              </li>
              <li>Abra o StudyBlock pelo ícone novo e vire o celular de lado.</li>
            </ol>
          </div>
        </Modal>
      )}
    </>
  );
}
