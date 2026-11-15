import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canFullscreen, enterFullscreen, exitFullscreen, fullscreenPreferred, isFullscreen } from '../../lib/fullscreen';

/** Telas do jogo (criança): entram em tela cheia. Landing, login e Área dos Pais ficam normais. */
const GAME = ['/inicio', '/select-age', '/adventure', '/loja', '/album', '/casa', '/relampago', '/treino', '/dashboard'];
const isGame = (path: string) => GAME.some((g) => path === g || path.startsWith(`${g}/`));

/**
 * Tela cheia automática: no 1º toque numa tela do jogo (o navegador exige um toque), entra em tela
 * cheia e trava deitado. Ao ir para a Área dos Pais, login ou landing, sai. O botão ⛶ desliga de vez.
 */
export function FullscreenRouter() {
  const { pathname } = useLocation();
  const game = isGame(pathname);

  useEffect(() => {
    if (!canFullscreen()) return;
    if (!game) {
      if (isFullscreen()) void exitFullscreen();
      return;
    }
    if (!fullscreenPreferred() || isFullscreen()) return;
    const onTap = () => {
      if (fullscreenPreferred() && !isFullscreen()) void enterFullscreen();
    };
    // pointerup/keyup contam como gesto da pessoa (pointerdown nem sempre, no Android)
    document.addEventListener('pointerup', onTap, { once: true });
    document.addEventListener('keyup', onTap, { once: true });
    return () => {
      document.removeEventListener('pointerup', onTap);
      document.removeEventListener('keyup', onTap);
    };
  }, [game, pathname]);

  return null;
}
