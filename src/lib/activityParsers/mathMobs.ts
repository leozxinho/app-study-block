import type { Activity } from '../../types';
import type { MobType } from '../../components/mobs/mobSprites';
import type { BlockKind } from '../../components/activities/shared/pixelSprites';
import { pickRandom } from '../random';
import { hasWord, normalize } from '../text';
import { DIFFICULTY_RULES, generateProblem, problemIssue, problemOptions, solve, type MathOp, type MathProblem } from '../mathGenerator';
import type { ParseMeta } from './common';

// =============================================================
// MATH-MOBS: contas mostradas com mobs/blocos na tela
// =============================================================

/** O que aparece na conta: um mob ou um bloco pixel. */
export interface MathUnit {
  key: string;
  singular: string;
  plural: string;
  mob?: MobType;
  block?: BlockKind;
  /** Mobs finos (creeper) aparecem um pouco maiores */
  sizeFactor?: number;
  /** Palavra feminina (as ovelhas, as galinhas) */
  fem?: boolean;
}

export const MATH_UNITS: (MathUnit & { keys: string[] })[] = [
  { key: 'creeper', keys: ['creeper', 'creepers'], singular: 'creeper', plural: 'creepers', mob: 'creeper', sizeFactor: 1.3 },
  { key: 'porco', keys: ['porco', 'porcos', 'porquinho', 'porquinhos'], singular: 'porco', plural: 'porcos', mob: 'pig' },
  { key: 'ovelha', keys: ['ovelha', 'ovelhas'], singular: 'ovelha', plural: 'ovelhas', mob: 'sheep' , fem: true },
  { key: 'galinha', keys: ['galinha', 'galinhas'], singular: 'galinha', plural: 'galinhas', mob: 'chicken' , fem: true },
  { key: 'vaca', keys: ['vaca', 'vacas'], singular: 'vaca', plural: 'vacas', mob: 'cow' , fem: true },
  { key: 'lobo', keys: ['lobo', 'lobos'], singular: 'lobo', plural: 'lobos', mob: 'wolf' },
  { key: 'zumbi', keys: ['zumbi', 'zumbis'], singular: 'zumbi', plural: 'zumbis', mob: 'zombie' },
  { key: 'esqueleto', keys: ['esqueleto', 'esqueletos'], singular: 'esqueleto', plural: 'esqueletos', mob: 'skeleton' },
  { key: 'morador', keys: ['morador', 'moradores', 'aldeao', 'aldeoes'], singular: 'morador', plural: 'moradores', mob: 'villager' },
  { key: 'diamante', keys: ['diamante', 'diamantes', 'gema', 'gemas'], singular: 'diamante', plural: 'diamantes', block: 'diamante' },
  { key: 'ouro', keys: ['ouro', 'barra de ouro', 'barras de ouro'], singular: 'bloco de ouro', plural: 'blocos de ouro', block: 'ouro' },
  { key: 'pedra', keys: ['pedra', 'pedras'], singular: 'pedra', plural: 'pedras', block: 'pedra' , fem: true },
  { key: 'esmeralda', keys: ['esmeralda', 'esmeraldas'], singular: 'esmeralda', plural: 'esmeraldas', block: 'esmeralda', fem: true },
  { key: 'redstone', keys: ['redstone', 'rubi', 'rubis'], singular: 'redstone', plural: 'redstones', block: 'redstone' },
  { key: 'bloco', keys: ['bloco', 'blocos'], singular: 'bloco', plural: 'blocos', block: 'grama' },
];

const DEFAULT_UNITS = ['porco', 'creeper', 'ovelha', 'galinha'];

/** Unidade citada na pergunta (expressão mais longa ganha: "blocos de ouro" > "blocos"). */
export function findMathUnit(text: string): MathUnit | null {
  let best: { u: MathUnit; len: number } | null = null;
  for (const u of MATH_UNITS) for (const k of u.keys) if (hasWord(text, k) && (!best || k.length > best.len)) best = { u, len: k.length };
  return best?.u ?? null;
}

/**
 * Item de cada grupo da conta: "2 esmeraldas + 3 rubis" → [esmeralda, redstone].
 * Olha o texto antes e depois do sinal (+ ou -); o que não citar item usa o do outro grupo ou o padrão.
 */
export function findMathUnitPair(text: string, fallback: MathUnit): [MathUnit, MathUnit] {
  const beforeEquals = text.split('=')[0];
  const match = beforeEquals.match(/^(.*?)\s[+−-]\s(.*)$/);
  if (!match) {
    const u = findMathUnit(text) ?? fallback;
    return [u, u];
  }
  const left = findMathUnit(match[1]);
  const right = findMathUnit(match[2]);
  const a = left ?? right ?? findMathUnit(text) ?? fallback;
  return [a, right ?? a];
}

export function unitByKey(key: string): MathUnit {
  return MATH_UNITS.find((u) => u.key === key) ?? MATH_UNITS[1];
}

const name = (u: MathUnit, n: number) => (n === 1 ? u.singular : u.plural);

/** Pergunta no formato que o parser entende ("2 creepers + 3 creepers = ?"). */
export function formatMathMobsQuestion(p: MathProblem, u: MathUnit): string {
  switch (p.op) {
    case '+':
      return `${p.a} ${name(u, p.a)} + ${p.b} ${name(u, p.b)} = ?`;
    case '-':
      return `${p.a} ${name(u, p.a)} - ${p.b} ${name(u, p.b)} = ?`;
    case '×':
      return `${p.a} fileiras × ${p.b} ${name(u, p.b)} = ?`;
    case '÷':
      return `${p.a} ${name(u, p.a)} ÷ ${p.b} cercados = ?`;
  }
}

/** Texto mostrado embaixo dos mobs. */
export function mathMobsLabel(p: MathProblem, u: MathUnit): string {
  switch (p.op) {
    case '+':
      return `${p.a} ${name(u, p.a)} + ${p.b} ${name(u, p.b)} = ?`;
    case '-':
      return `${p.a} ${name(u, p.a)} − ${p.b} ${name(u, p.b)} = ?`;
    case '×':
      return `${p.a} fileiras de ${p.b} ${name(u, p.b)} = ?`;
    case '÷':
      return `${p.a} ${name(u, p.a)} ÷ ${p.b} cercados = ?`;
  }
}

export function mathMobsHint(p: MathProblem, u: MathUnit): string {
  const os = u.fem ? 'as' : 'os';
  const todos = u.fem ? 'todas juntas' : 'todos juntos';
  switch (p.op) {
    case '+':
      return `conte ${os} ${u.plural} de novo: ${os} ${p.a} que vieram da esquerda e ${os} ${p.b} da direita, ${todos}.`;
    case '-':
      return `conte ${os} ${u.plural} de novo, só ${os} que sobraram (${os} que viraram fumaça não contam).`;
    case '×':
      return `conte ${os} ${u.plural} de novo: são ${p.a} fileiras com ${p.b} em cada uma.`;
    case '÷':
      return `conte ${os} ${u.plural} de novo, mas só ${os} que estão dentro de UM cercado.`;
  }
}

/** Operação pedida por palavras ("adição", "tirar", "fileiras", "dividir"...). */
function opFromWords(text: string): MathOp | null {
  const q = normalize(text);
  if (/(adicao|soma|somar|junta|juntar|\+)/.test(q)) return '+';
  if (/(subtracao|tira|tirar|menos|sobra)/.test(q)) return '-';
  if (/(multiplica|vezes|fileira|×)/.test(q)) return '×';
  if (/(divis|divid|reparti|cercado|÷)/.test(q)) return '÷';
  return null;
}

export interface MathMobsData extends ParseMeta {
  problem: MathProblem;
  unit: MathUnit;
  options: number[];
  /** A conta veio escrita na pergunta (ou foi sorteada pelo gerador) */
  fromQuestion: boolean;
}

export function parseMathMobs(activity: Pick<Activity, 'question' | 'difficulty'>): MathMobsData {
  const q = activity.question;
  const unit = findMathUnit(q) ?? unitByKey(pickRandom(DEFAULT_UNITS));
  const m = q.match(/(\d+)[^\d+\-×x÷=?!]*?([+\-×x÷])\s*(\d+)/i);
  const count = activity.difficulty === 'facil' ? 3 : 4;

  if (m) {
    const op: MathOp = m[2] === '+' ? '+' : m[2] === '-' ? '-' : m[2] === '÷' ? '÷' : '×';
    const p = solve(+m[1], op, +m[3]);
    const issue = problemIssue(p);
    const allowed = DIFFICULTY_RULES[activity.difficulty].ops.includes(op);
    return {
      recognized: !issue && allowed,
      note: issue ?? (allowed ? undefined : `operação ${op} não é da dificuldade "${activity.difficulty}"`),
      problem: p, unit, fromQuestion: true,
      options: issue ? [p.answer] : problemOptions(p, count),
    };
  }

  const op = opFromWords(q) ?? undefined;
  const p = generateProblem(activity.difficulty, op);
  return { recognized: true, problem: p, unit, fromQuestion: false, options: problemOptions(p, count) };
}

/** Pergunta de uma rodada extra: mesma operação, mesma unidade, conta nova. */
export function mathMobsVariant(activity: Pick<Activity, 'question' | 'difficulty'>): string {
  const { problem, unit } = parseMathMobs(activity);
  return formatMathMobsQuestion(generateProblem(activity.difficulty, problem.op), unit);
}

export const MATH_MOBS_ROUNDS = 8;
