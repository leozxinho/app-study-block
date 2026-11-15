/**
 * Tela cheia no jogo (celular e tablet, de lado).
 *
 * - Android e computador: Fullscreen API (precisa de um toque da pessoa) + tela travada deitada.
 * - iPhone: o Safari não deixa site nenhum entrar em tela cheia; o jeito é instalar o app
 *   ("Adicionar à Tela de Início"), que abre sem as barras do navegador.
 * A escolha (ligada/desligada) fica salva no aparelho; começa ligada.
 */
import { useSyncExternalStore } from 'react';

const PREF_KEY = 'studyblock_fullscreen';

type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> };
type FsElement = HTMLElement & { webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> };
type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> };

const doc = () => (typeof document === 'undefined' ? null : (document as FsDocument));

/** O navegador deixa entrar em tela cheia? (no iPhone, não) */
export function canFullscreen(): boolean {
  const el = doc()?.documentElement as FsElement | undefined;
  return !!el && (typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function');
}

/** Aberto como app instalado (já sem as barras do navegador). */
export function isInstalledApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iPad com iOS 13+ se apresenta como Mac; o toque denuncia
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isFullscreen(): boolean {
  const d = doc();
  return !!(d?.fullscreenElement ?? d?.webkitFullscreenElement);
}

export function fullscreenPreferred(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

function setPreferred(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    /* sem localStorage */
  }
}

/** Trava deitado (só funciona em tela cheia, no Android). Em tablet/computador sem suporte, ignora. */
async function lockLandscape() {
  try {
    await (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape');
  } catch {
    /* sem suporte ou não permitido: segue sem travar */
  }
}

function unlockOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch {
    /* sem suporte */
  }
}

/** Entra em tela cheia (chamar dentro de um toque). Devolve se conseguiu. */
export async function enterFullscreen(): Promise<boolean> {
  if (isFullscreen()) return true;
  const el = doc()?.documentElement as FsElement | undefined;
  if (!el) return false;
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else return false;
  } catch {
    return false;
  }
  await lockLandscape();
  return true;
}

export async function exitFullscreen(): Promise<void> {
  unlockOrientation();
  const d = doc();
  if (!d || !isFullscreen()) return;
  try {
    if (d.exitFullscreen) await d.exitFullscreen();
    else await d.webkitExitFullscreen?.();
  } catch {
    /* já saiu */
  }
}

/** Botão ⛶: liga/desliga e lembra a escolha. */
export async function toggleFullscreen(): Promise<void> {
  if (isFullscreen()) {
    setPreferred(false);
    await exitFullscreen();
  } else {
    setPreferred(true);
    await enterFullscreen();
  }
}

function subscribe(cb: () => void) {
  const d = doc();
  if (!d) return () => {};
  d.addEventListener('fullscreenchange', cb);
  d.addEventListener('webkitfullscreenchange', cb);
  return () => {
    d.removeEventListener('fullscreenchange', cb);
    d.removeEventListener('webkitfullscreenchange', cb);
  };
}

/** Re-renderiza ao entrar/sair da tela cheia. */
export function useIsFullscreen(): boolean {
  return useSyncExternalStore(subscribe, isFullscreen, () => false);
}
