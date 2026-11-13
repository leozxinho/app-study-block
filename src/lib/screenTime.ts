/** Regras do tempo de tela (sem React): quanto falta e se acabou. */
export interface ScreenTimeState {
  day: string;
  seconds: number;
  extraMin: number;
}

/** Segundos que ainda restam hoje; null = sem limite. */
export function secondsLeft(limitMin: number, state: ScreenTimeState, today: string): number | null {
  if (!limitMin) return null;
  const played = state.day === today ? state.seconds : 0;
  const extra = state.day === today ? state.extraMin : 0;
  return Math.max(0, (limitMin + extra) * 60 - played);
}

/** Desafio para o adulto liberar mais tempo (a criança pequena não resolve). */
export function adultChallenge(seed: number): { question: string; answer: number } {
  const a = 6 + (seed % 4); // 6..9
  const b = 7 + ((seed >> 3) % 3); // 7..9
  return { question: `Quanto é ${a} × ${b}?`, answer: a * b };
}
