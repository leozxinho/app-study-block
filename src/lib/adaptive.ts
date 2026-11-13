/**
 * Dificuldade que se adapta à criança (sem React): olha os últimos resultados e diz se as
 * próximas rodadas devem ser mais fáceis ou mais difíceis. As rodadas continuam vindo da
 * lista fixa de variações (todas com voz gravada); muda só QUAIS são escolhidas.
 */
export type Adaptive = 'easier' | 'normal' | 'harder';

/** Últimos resultados (estrelas de 1 a 3). Precisa de pelo menos 5 para decidir. */
export function adaptiveLevel(recent: { stars: number }[]): Adaptive {
  const last = recent.slice(-10);
  if (last.length < 5) return 'normal';
  const avg = last.reduce((s, r) => s + (r.stars || 0), 0) / last.length;
  if (avg >= 2.7) return 'harder';
  if (avg <= 1.6) return 'easier';
  return 'normal';
}

/** "Peso" de uma pergunta: números maiores e textos mais longos = mais difícil. */
export function questionWeight(text: string): number {
  const nums = (text.match(/\d+/g) ?? []).map(Number);
  const numeric = nums.reduce((s, n) => s + n, 0);
  return nums.length ? numeric * 10 + nums.length : text.length;
}

/** Escolhe n variações conforme o nível: a metade mais difícil, a mais fácil ou todas. */
export function pickByLevel<T extends string>(pool: T[], n: number, level: Adaptive, shuffle: (a: T[]) => T[]): T[] {
  if (level === 'normal' || pool.length <= n) return shuffle(pool).slice(0, n);
  const sorted = [...pool].sort((a, b) => questionWeight(a) - questionWeight(b));
  const half = Math.max(n, Math.ceil(sorted.length / 2));
  const part = level === 'harder' ? sorted.slice(-half) : sorted.slice(0, half);
  return shuffle(part).slice(0, n);
}
