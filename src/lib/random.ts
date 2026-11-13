// Sorteios usados pelas atividades (sem React: também roda no script de auditoria).

/** Gerador atual: Math.random, ou um gerador com semente dentro de withSeed(). */
let rng: () => number = Math.random;

/** Número entre 0 e 1 (use no lugar de Math.random para os sorteios das atividades). */
export function rand(): number {
  return rng();
}

/** Gerador com semente (mulberry32): mesma semente, mesma sequência. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Roda fn com sorteios repetíveis (as variações fixas das atividades, que têm voz gravada). */
export function withSeed<T>(seed: number, fn: () => T): T {
  const previous = rng;
  rng = seeded(seed);
  try {
    return fn();
  } finally {
    rng = previous;
  }
}

/** Número fixo a partir de um texto (ex.: id da atividade) para usar como semente. */
export function seedFromText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Embaralha sem viés (Fisher-Yates). Não altera o array original. */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Embaralha garantindo que não fique na mesma ordem (para atividades de ordenar). */
export function shuffleChanged<T>(items: readonly T[]): T[] {
  if (items.length < 2) return [...items];
  for (let tries = 0; tries < 10; tries++) {
    const s = shuffle(items);
    if (s.some((v, i) => v !== items[i])) return s;
  }
  return [...items].reverse();
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

/** Inteiro entre min e max (inclusive). */
export function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

/** N valores diferentes, sorteados de uma lista. */
export function sample<T>(items: readonly T[], n: number): T[] {
  return shuffle(items).slice(0, n);
}
