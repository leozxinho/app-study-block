import type { Activity } from '../../types';
import type { MobType } from '../../components/mobs/mobSprites';
import { pickRandom, sample, shuffle, rand } from '../random';
import { hasWord, normalize, numbersIn } from '../text';
import { findWord, WORDS } from '../words';
import { findPlusPieces } from './sequenceOrdering';
import type { ParseMeta } from './common';
import type { MathProblem } from './multipleChoice';

// =============================================================
// ARRASTAR (drag-drop)
// =============================================================

export interface DragItem {
  id: string;
  label: string;
  /** Posição certa; −1 = não vai em nenhum lugar (distrator) */
  correctIndex: number;
  blockSize?: number;
  emoji?: string;
}

export interface DragDropData extends ParseMeta {
  mode: 'numbers' | 'sizes' | 'syllables' | 'deliver';
  items: DragItem[];
  slots: number;
  /** Figura do alvo (modo "leve X até Y") */
  targetEmoji?: string;
  targetLabel?: string;
}

/** Coisas que podem ser "levadas até" outra no modo deliver. */
export const DELIVER_NOUNS: { keys: string[]; emoji: string; label: string }[] = [
  { keys: ['picareta'], emoji: '⛏️', label: 'Picareta' },
  { keys: ['gema', 'pedra preciosa'], emoji: '💎', label: 'Gema' },
  { keys: ['comida', 'racao'], emoji: '🍖', label: 'Comida' },
  { keys: ['peixe', 'peixinho'], emoji: '🐟', label: 'Peixe' },
  { keys: ['olho de ender', 'olho'], emoji: '👁️', label: 'Olho de ender' },
  { keys: ['portal'], emoji: '🌀', label: 'Portal' },
  { keys: ['chave'], emoji: '🔑', label: 'Chave' },
  { keys: ['bau'], emoji: '🧰', label: 'Baú' },
  { keys: ['osso'], emoji: '🦴', label: 'Osso' },
  { keys: ['lobo', 'cachorro'], emoji: '🐺', label: 'Lobo' },
  { keys: ['cenoura'], emoji: '🥕', label: 'Cenoura' },
  { keys: ['coelho'], emoji: '🐰', label: 'Coelho' },
  { keys: ['semente', 'sementes'], emoji: '🌱', label: 'Semente' },
  { keys: ['galinha'], emoji: '🐔', label: 'Galinha' },
];

const SIZE_BLOCKS: DragItem[] = [
  { id: 's1', label: 'Bloco pequenino', correctIndex: 0, blockSize: 20 },
  { id: 's2', label: 'Bloco pequeno', correctIndex: 1, blockSize: 28 },
  { id: 's3', label: 'Bloco médio', correctIndex: 2, blockSize: 36 },
  { id: 's4', label: 'Bloco grande', correctIndex: 3, blockSize: 44 },
];

function findNoun(text: string) {
  let best: { n: (typeof DELIVER_NOUNS)[number]; len: number } | null = null;
  for (const n of DELIVER_NOUNS) for (const k of n.keys) if (hasWord(text, k) && (!best || k.length > best.len)) best = { n, len: k.length };
  return best?.n ?? null;
}

export function parseDragDrop(activity: Pick<Activity, 'question' | 'category' | 'difficulty'>): DragDropData {
  const q = activity.question;
  const ql = normalize(q);

  const plus = findPlusPieces(q);
  if (plus) {
    return { recognized: true, mode: 'syllables', slots: plus.length, items: plus.map((s, i) => ({ id: `p${i}`, label: s, correctIndex: i })) };
  }

  // "Arraste a picareta até a gema"
  const deliver = ql.match(/arraste\s+(?:a|o|as|os)?\s*(.+?)\s+(?:ate|para|no|na|ao)\s+(?:a|o|as|os)?\s*(.+?)(?:\s+para\s+.*)?[!.?]*$/);
  if (deliver) {
    const item = findNoun(deliver[1]);
    const target = findNoun(deliver[2]);
    if (item && target) {
      const distractors = sample(DELIVER_NOUNS.filter((n) => n !== item && n !== target), 2);
      return {
        recognized: true, mode: 'deliver', slots: 1, targetEmoji: target.emoji, targetLabel: target.label,
        items: shuffle([
          { id: 'ok', label: item.label, emoji: item.emoji, correctIndex: 0 },
          ...distractors.map((d, i) => ({ id: `x${i}`, label: d.label, emoji: d.emoji, correctIndex: -1 })),
        ]),
      };
    }
  }

  const list = q.match(/\d+(?:\s*,\s*\d+){1,}/);
  if (activity.category === 'matematica' || ql.includes('numero') || ql.includes('ordem') || list) {
    const values = list ? [...numbersIn(list[0])].sort((a, b) => a - b) : Array.from({ length: activity.difficulty === 'dificil' ? 5 : activity.difficulty === 'medio' ? 4 : 3 }, (_, i) => i + 1);
    return { recognized: true, mode: 'numbers', slots: values.length, items: values.map((v, i) => ({ id: `n${i}`, label: String(v), correctIndex: i })) };
  }

  const unrelated = ['palavra', 'letra', 'silaba', 'cor'].find((w) => hasWord(ql, w));
  return {
    recognized: !unrelated,
    note: unrelated ? `fala de "${unrelated}", mas vira ordenar blocos por tamanho` : undefined,
    mode: 'sizes', slots: SIZE_BLOCKS.length, items: SIZE_BLOCKS,
  };
}

// =============================================================
// CRAFTING
// =============================================================

export type ToolKind = 'graveto' | 'mesa' | 'tocha' | 'espada' | 'pa' | 'picareta' | 'machado';
export type ItemKind = 'tabua' | 'pedra' | 'graveto' | 'carvao';
const INGREDIENT: Record<string, ItemKind> = { P: 'tabua', C: 'pedra', S: 'graveto', K: 'carvao' };

export const RECIPES: { tool: ToolKind; keys: string[]; rows: string[]; tier: Activity['difficulty']; name: string }[] = [
  { tool: 'graveto', keys: ['graveto'], rows: ['.P.', '.P.', '...'], tier: 'facil', name: 'um graveto' },
  { tool: 'mesa', keys: ['mesa', 'bancada'], rows: ['PP.', 'PP.', '...'], tier: 'facil', name: 'uma mesa de trabalho' },
  { tool: 'tocha', keys: ['tocha'], rows: ['.K.', '.S.', '...'], tier: 'facil', name: 'uma tocha' },
  { tool: 'espada', keys: ['espada'], rows: ['.C.', '.C.', '.S.'], tier: 'medio', name: 'uma espada' },
  { tool: 'pa', keys: ['pa', 'pazinha'], rows: ['.C.', '.S.', '.S.'], tier: 'medio', name: 'uma pá' },
  { tool: 'picareta', keys: ['picareta'], rows: ['CCC', '.S.', '.S.'], tier: 'dificil', name: 'uma picareta' },
  { tool: 'machado', keys: ['machado'], rows: ['CC.', 'CS.', '.S.'], tier: 'dificil', name: 'um machado' },
];

export interface CraftingData extends ParseMeta {
  tool: ToolKind;
  material: 'pedra' | 'madeira';
  cells: (ItemKind | null)[];
}

export function parseCrafting(activity: Pick<Activity, 'question' | 'difficulty'>): CraftingData {
  const q = activity.question;
  const found = RECIPES.find((r) => r.keys.some((k) => hasWord(q, k)));
  const recipe = found ?? pickRandom(RECIPES.filter((r) => r.tier === activity.difficulty));
  const material: 'pedra' | 'madeira' = hasWord(q, 'madeira') && recipe.rows.join('').includes('C') ? 'madeira' : 'pedra';
  const cells = recipe.rows.join('').split('').map((c) => (c === '.' ? null : INGREDIENT[material === 'madeira' && c === 'C' ? 'P' : c]));
  return { recognized: Boolean(found), note: found ? undefined : 'receita não reconhecida (sorteada)', tool: recipe.tool, material, cells };
}

// =============================================================
// MINERAR CONTA (mining-math)
// =============================================================

export interface MiningData extends ParseMeta {
  problem: MathProblem;
}

export function parseMiningMath(activity: Pick<Activity, 'question' | 'difficulty'>): MiningData {
  const m = activity.question.match(/(\d+)\s*([+\-x×÷/])\s*(\d+)/i);
  const solve = (a: number, op: MathProblem['op'], b: number): MathProblem => ({ a, b, op, answer: op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b });
  if (m) {
    const op = m[2] === '+' ? '+' : m[2] === '-' ? '-' : m[2] === '÷' || m[2] === '/' ? '÷' : '×';
    const p = solve(+m[1], op, +m[3]);
    const ok = Number.isInteger(p.answer) && p.answer >= 0;
    return { recognized: ok, note: ok ? undefined : p.answer < 0 ? 'resultado negativo' : 'divisão com resto', problem: p };
  }
  const max = activity.difficulty === 'facil' ? 5 : activity.difficulty === 'medio' ? 10 : 20;
  const a = 1 + Math.floor(rand() * max);
  const b = 1 + Math.floor(rand() * Math.min(a, max));
  return { recognized: true, problem: solve(a, rand() < 0.5 ? '+' : '-', b) };
}

// =============================================================
// MONTAR PALAVRA (word-builder)
// =============================================================

const UPPER = 'A-ZÇÃÕÁÉÍÓÚÂÊÔ';

export interface WordBuilderData extends ParseMeta {
  word: string;
  pieces: string[];
  bySyllable: boolean;
  displayQuestion: string;
  picture?: { mob?: MobType; emoji?: string };
}

export function parseWordBuilder(activity: Pick<Activity, 'question'>): WordBuilderData {
  const hidden = activity.question.match(new RegExp(`\\(([${UPPER}-]+)\\)`));
  const source = hidden ? hidden[1] : activity.question;
  const displayQuestion = hidden ? activity.question.replace(hidden[0], '').trim() : activity.question;
  const syl = source.match(new RegExp(`([${UPPER}]+(?:-[${UPPER}]+)+)`));
  const words = source.match(new RegExp(`[${UPPER}]{2,}`, 'g'));
  const word = syl ? syl[1].replace(/-/g, '') : words?.[words.length - 1];
  if (!word) {
    return { recognized: false, note: 'palavra em MAIÚSCULAS não encontrada', word: 'CASA', pieces: ['C', 'A', 'S', 'A'], bySyllable: false, displayQuestion, picture: { emoji: '🏠' } };
  }
  const entry = findWord(word);
  return {
    recognized: Boolean(entry),
    note: entry ? undefined : `"${word}" não tem figura cadastrada`,
    word,
    pieces: syl ? syl[1].split('-') : word.split(''),
    bySyllable: Boolean(syl),
    displayQuestion,
    picture: entry ? { mob: entry.mob, emoji: entry.emoji } : undefined,
  };
}

/** Palavras com figura para as rodadas extras. */
export function otherWords(exclude: string, maxLetters = 7) {
  return WORDS.filter((w) => w.word !== exclude && w.word.length <= maxLetters);
}

// =============================================================
// SOMBRAS e CONSTRUÇÃO
// =============================================================

export function shadowCount(activity: Pick<Activity, 'age_group' | 'difficulty'>): number {
  if (activity.age_group === 'bercario') return 2;
  return activity.difficulty === 'facil' ? 3 : activity.difficulty === 'medio' ? 4 : 5;
}

export function buildSize(activity: Pick<Activity, 'question' | 'difficulty'>): ParseMeta & { size: number } {
  const m = activity.question.match(/(\d)\s*x\s*(\d)/i);
  if (m) {
    const ok = m[1] === m[2] && +m[1] >= 2 && +m[1] <= 4;
    return { recognized: ok, note: ok ? undefined : `grade "${m[0]}" não suportada (só 2x2, 3x3, 4x4)`, size: ok ? +m[1] : 2 };
  }
  return { recognized: true, size: activity.difficulty === 'facil' ? 2 : activity.difficulty === 'medio' ? 3 : 4 };
}

