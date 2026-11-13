import type { KeyboardEvent } from 'react';
import type { Activity } from '../../../types';

export interface ActivityProps {
  activity: Activity;
  onCorrect: () => void;
  onWrong: () => void;
}

// Sorteios ficam em src/lib/random.ts (também usados pelos parsers e pela auditoria)
export { shuffle, shuffleChanged, pickRandom } from '../../../lib/random';

/** Setas do teclado movem o foco entre os botões de uma grade. */
export function arrowNav(e: KeyboardEvent<HTMLElement>): void {
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
  if (!keys.includes(e.key)) return;
  const buttons = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
  );
  const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0 || buttons.length < 2) return;
  const firstTop = buttons[0].offsetTop;
  const cols = Math.max(1, buttons.filter((b) => b.offsetTop === firstTop).length);
  const delta =
    e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? cols : -cols;
  e.preventDefault();
  buttons[(i + delta + buttons.length) % buttons.length].focus();
}

/** Base comum dos botões de resposta: alvo grande, foco visível, sem atraso no toque. */
export const OPTION_BASE =
  'relative min-h-[72px] touch-manipulation select-none transition-all ' +
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-minecraft-lapis';
