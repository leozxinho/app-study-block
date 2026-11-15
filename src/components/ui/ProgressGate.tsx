import { BlockLoader } from './BlockLoader';
import { useEffect, useState, type ReactNode } from 'react';
import { progressStore, useStoreStatus } from '../../lib/store';
import { MinecraftButton } from './MinecraftButton';

/**
 * Mostra as telas só depois que o progresso da conta carregou
 * (no Firebase vem da internet). Trocar de conta remonta as telas com os dados novos.
 */
export function ProgressGate({ children }: { children: ReactNode }) {
  const { status, accountId } = useStoreStatus();
  const [slow, setSlow] = useState(false);

  // Só mostra "carregando" se demorar (no navegador é instantâneo)
  useEffect(() => {
    if (status !== 'loading') return;
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 250);
    return () => clearTimeout(t);
  }, [status, accountId]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-sky px-4">
        <div role="alert" className="bg-white pixel-border p-6 max-w-sm text-center font-body text-gray-900">
          <p className="text-4xl mb-2" aria-hidden="true">📡</p>
          <p className="font-bold mb-1">Não conseguimos carregar o progresso.</p>
          <p className="text-sm text-gray-700 mb-4">Confira a internet e tente de novo.</p>
          <MinecraftButton variant="gold" size="md" onClick={() => void progressStore.retry()}>
            Tentar de novo
          </MinecraftButton>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return slow ? (
      <div className="min-h-screen flex items-center justify-center bg-brand-sky" role="status">
        <BlockLoader dark />
      </div>
    ) : null;
  }

  return <div key={accountId} className="contents">{children}</div>;
}
