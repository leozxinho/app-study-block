// Animações do app: sempre ligadas, mesmo quando o sistema pede para reduzir.
// O CSS lê data-motion="on" no <html> e não aplica as regras de "reduzir movimento".

/** Marca no <html> (data-motion) para o CSS. Chamada ao abrir o app. */
export function applyMotionPref(): void {
  document.documentElement.dataset.motion = 'on';
}

/** Deve reduzir as animações? Nunca. */
export function useReduceMotion(): boolean {
  return false;
}
