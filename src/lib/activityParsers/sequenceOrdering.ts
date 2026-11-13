import type { Activity } from '../../types';
import { pickRandom, randInt, sample, shuffle } from '../random';
import { graphemes, isSymbol, normalize, numbersIn, syllabify } from '../text';
import { findWord } from '../words';
import type { ParseMeta } from './common';

// =============================================================
// SEQUÊNCIA ("o que vem depois?")
// =============================================================

export interface SeqItem {
  value: string;
  /** Nome para leitor de tela / quando a figura é uma palavra */
  label: string;
  isNumber?: boolean;
}

export interface SequenceData extends ParseMeta {
  pattern: SeqItem[];
  answer: SeqItem;
  options: SeqItem[];
  hint: string;
}

/** Palavras que viram figura nas sequências escritas por extenso. */
export const WORD_EMOJI: Record<string, string> = {
  arvore: '🌳', flor: '🌸', diamante: '💎', esmeralda: '💚', cacto: '🌵', piramide: '🔺', peixe: '🐟',
  concha: '🐚', floco: '❄️', pinguim: '🐧', fogo: '🔥', lava: '🌋', coroa: '👑', escudo: '🛡️',
  estrela: '⭐', cristal: '🔮', quadrado: '🟦', circulo: '🔴', triangulo: '🔼', sol: '☀️', lua: '🌙',
  vermelho: '🟥', azul: '🟦', verde: '🟩', amarelo: '🟨', roxo: '🟪', laranja: '🟧', bloco: '🟫',
  porco: '🐷', vaca: '🐄', ovelha: '🐑', galinha: '🐔',
};

const DISTRACTORS = ['🍎', '🟩', '🟨', '⭐', '🌙', '🐟', '🍄', '💎', '🔥', '🌸', '🟪', '⚽'];

/** Menor período que se repete: [A,B,A,B,A] → 2; [A,B,A] → 2. Sem repetição → null. */
export function findPeriod<T>(seq: T[]): number | null {
  for (let p = 1; p < seq.length; p++) {
    if (seq.every((v, i) => v === seq[i % p])) return p;
  }
  return null;
}

function buildPattern(items: SeqItem[], hintLabel: string): SequenceData | null {
  const keys = items.map((i) => i.value);
  const p = findPeriod(keys);
  if (!p) return null;
  const answer = items[items.length % p];
  const unique = items.filter((it, i) => keys.indexOf(it.value) === i);
  const extra = DISTRACTORS.filter((d) => !keys.includes(d)).map((d) => ({ value: d, label: d }));
  const options = shuffle([...unique, ...shuffle(extra)].slice(0, Math.max(4, unique.length)).slice(0, 4));
  if (!options.some((o) => o.value === answer.value)) options[0] = answer;
  return {
    recognized: true,
    pattern: items,
    answer,
    options: shuffle(options),
    hint: `as figuras se repetem: ${hintLabel}...`,
  };
}

export function parseSequence(activity: Pick<Activity, 'question'>): SequenceData {
  const q = activity.question;

  // 1) números: "2, 4, 6, ?"
  const numMatch = q.match(/\d+(?:\s*,\s*\d+){2,}/);
  if (numMatch) {
    const seq = numbersIn(numMatch[0]);
    const diff = seq[1] - seq[0];
    const constant = seq.every((v, i) => i === 0 || v - seq[i - 1] === diff);
    const answer = seq[seq.length - 1] + diff;
    const opts = new Set<number>([answer]);
    for (const d of shuffle([1, -1, 2, -2, diff, -diff, 3])) {
      if (opts.size >= 4) break;
      const v = answer + d;
      if (v >= 0 && !seq.includes(v)) opts.add(v);
    }
    let fill = answer + 4;
    while (opts.size < 4) opts.add(fill++);
    const toItem = (n: number) => ({ value: String(n), label: String(n), isNumber: true });
    return {
      recognized: constant && answer >= 0,
      note: !constant ? 'sequência não aumenta sempre igual' : answer < 0 ? 'resposta negativa' : undefined,
      pattern: seq.map(toItem),
      answer: toItem(answer),
      options: shuffle([...opts]).map(toItem),
      hint: diff >= 0 ? `de um número para o outro aumenta ${diff}.` : `de um número para o outro diminui ${-diff}.`,
    };
  }

  // 2) figuras/símbolos (mesmo colados: 🐦🦋🐦🦋 ou ▲●▲●)
  const symbols = graphemes(q.replace(/[?？❓]/g, ' ')).filter((g) => isSymbol(g));
  if (symbols.length >= 3) {
    const items = symbols.map((s) => ({ value: s, label: s }));
    const r = buildPattern(items, symbols.slice(0, 2).join(' '));
    if (r) return r;
    return { ...fallbackPattern(), recognized: false, note: `padrão de figuras sem repetição (${symbols.join('')})` };
  }

  // 3) palavras: "Árvore, flor, árvore, ...?"
  const list = q.match(/([\p{L}-]+(?:\s*,\s*[\p{L}-]+){2,})/u);
  if (list) {
    const words = list[1].split(',').map((w) => w.trim()).filter(Boolean);
    const items = words.map((w) => {
      const key = normalize(w).replace(/-.*$/, '');
      return { value: WORD_EMOJI[key] ?? w, label: w.toLowerCase() };
    });
    const r = buildPattern(items, words.slice(0, 2).map((w) => w.toLowerCase()).join(', '));
    if (r) return r;
    return { ...fallbackPattern(), recognized: false, note: `padrão escrito sem repetição (${words.join(', ')})` };
  }

  return { ...fallbackPattern(), recognized: false, note: 'pergunta sem padrão (é sorteado um)' };
}

const DEFAULT_PAIRS: [string, string][] = [
  ['🟥', '🟦'], ['🌳', '🌸'], ['⭐', '🌙'], ['❄️', '⛄'], ['🔥', '💧'], ['🍎', '🍌'], ['🐷', '🐑'],
];

function fallbackPattern(): SequenceData {
  const [a, b] = pickRandom(DEFAULT_PAIRS);
  const items = [a, b, a, b].map((v) => ({ value: v, label: v }));
  return { ...(buildPattern(items, `${a} ${b}`) as SequenceData), recognized: true };
}

/** Pergunta nova de sequência (rodadas extras). */
export function makeSequenceQuestion(kind: 'number' | 'symbol', step = 2): string {
  if (kind === 'number') {
    const start = randInt(0, 6);
    const s = Math.max(1, step);
    return `Complete a sequência: ${[0, 1, 2, 3].map((i) => start + i * s).join(', ')}, ?`;
  }
  const [a, b] = pickRandom(DEFAULT_PAIRS);
  return `Complete o padrão: ${a} ${b} ${a} ${b} ${a} ?`;
}

// =============================================================
// ORDENAR
// =============================================================

export interface OrderItem {
  id: string;
  text: string;
  order: number;
  /** Tamanho relativo (ordenar figuras do menor ao maior) */
  scale?: number;
}

export interface OrderingData extends ParseMeta {
  items: OrderItem[];
  kind: 'syllables' | 'letters' | 'numbers' | 'alphabet' | 'sizes';
  word?: string;
}

const toItems = (texts: string[]): OrderItem[] => texts.map((text, i) => ({ id: String(i + 1), text, order: i + 1 }));

/** "CA + SA + DO" → ['CA', 'SA', 'DO'] (aceita acento e ç). */
export function findPlusPieces(question: string): string[] | null {
  const m = question.match(/[\p{L}]+(?:\s*\+\s*[\p{L}]+)+/u);
  return m ? m[0].split('+').map((s) => s.trim().toUpperCase()) : null;
}

const SIZE_EMOJI: Record<string, string> = { minera: '💎', cavaleir: '🤺', bloco: '🟫', arvore: '🌳', torre: '🏰', peixe: '🐟' };

export function parseOrdering(activity: Pick<Activity, 'question' | 'difficulty'>): OrderingData {
  const q = activity.question;
  const ql = normalize(q);

  const plus = findPlusPieces(q);
  if (plus) return { recognized: true, kind: 'syllables', items: toItems(plus), word: plus.join('') };

  const word = q.match(/(?:formar?|forme)\s*:?\s*(?:a\s+palavra\s+)?([\p{L}]{2,})/iu);
  if (word) {
    const w = word[1].toUpperCase();
    if (ql.includes('letra')) return { recognized: true, kind: 'letters', items: toItems(w.split('')), word: w };
    return { recognized: true, kind: 'syllables', items: toItems(findWord(w)?.syllables ?? syllabify(w)), word: w };
  }

  const letters = q.match(/\b([A-Z])\s*,\s*([A-Z])\s*,\s*([A-Z])(?:\s*,\s*([A-Z]))?/);
  if (letters) return { recognized: true, kind: 'letters', items: toItems([letters[1], letters[2], letters[3], letters[4]].filter(Boolean).sort()) };
  if (ql.includes('alfabeto') || (ql.includes('letra') && ql.includes('ordem'))) {
    const count = activity.difficulty === 'dificil' ? 5 : 4;
    const start = randInt(0, 25 - count);
    return { recognized: true, kind: 'alphabet', items: toItems(Array.from({ length: count }, (_, i) => String.fromCharCode(65 + start + i))) };
  }

  const nums = q.match(/\d+(?:\s*,\s*\d+){2,}/);
  if (nums) {
    const list = numbersIn(nums[0]);
    const desc = /maior para o menor|maior ao menor|decrescente/.test(ql);
    const sorted = [...list].sort((a, b) => (desc ? b - a : a - b));
    const dup = new Set(list).size !== list.length;
    return { recognized: !dup, note: dup ? 'números repetidos' : undefined, kind: 'numbers', items: toItems(sorted.map(String)) };
  }

  // "Ordene os minerais do menor ao maior" → a mesma figura em tamanhos diferentes
  const sizeKey = Object.keys(SIZE_EMOJI).find((k) => ql.includes(k));
  if (sizeKey && /(menor|maior|baixo|alto|pequeno|grande)/.test(ql)) {
    const n = activity.difficulty === 'facil' ? 3 : 4;
    return {
      recognized: true, kind: 'sizes',
      items: Array.from({ length: n }, (_, i) => ({ id: String(i + 1), text: SIZE_EMOJI[sizeKey], order: i + 1, scale: 0.6 + i * 0.35 })),
    };
  }

  if (/(numero|crescente|ordene)/.test(ql)) {
    const count = activity.difficulty === 'dificil' ? 5 : activity.difficulty === 'medio' ? 4 : 3;
    return { recognized: true, kind: 'numbers', items: toItems(sample(Array.from({ length: 10 }, (_, i) => i + 1), count).sort((a, b) => a - b).map(String)) };
  }

  return { recognized: false, note: 'pergunta de ordenar não reconhecida (vira 1, 2, 3)', kind: 'numbers', items: toItems(['1', '2', '3']) };
}
