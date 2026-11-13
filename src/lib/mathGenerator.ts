import type { Difficulty } from '../types';
import { pickRandom, randInt, shuffle } from './random';

// Gerador de contas para as atividades com mobs (sem React: também roda na auditoria).

export type MathOp = '+' | '-' | '×' | '÷';

export interface MathProblem {
  a: number;
  b: number;
  op: MathOp;
  answer: number;
}

/** Mais que isso não cabe no celular. */
export const MAX_ON_SCREEN = 20;

/**
 * Regras por dificuldade:
 *  - fácil:   só + e −, números até 5
 *  - médio:   + e − até 10, × até 3x3
 *  - difícil: todas; × até 5x5 (limitado a 20 mobs), ÷ exata até 20
 */
export const DIFFICULTY_RULES: Record<Difficulty, { ops: MathOp[]; max: number; multMax: number; divMax: number }> = {
  facil: { ops: ['+', '-'], max: 5, multMax: 0, divMax: 0 },
  medio: { ops: ['+', '-', '×'], max: 10, multMax: 3, divMax: 0 },
  dificil: { ops: ['+', '-', '×', '÷'], max: 10, multMax: 5, divMax: 20 },
};

export function solve(a: number, op: MathOp, b: number): MathProblem {
  const answer = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
  return { a, b, op, answer };
}

/** Quantos mobs aparecem na tela para esta conta. */
export function mobsOnScreen(p: MathProblem): number {
  if (p.op === '+') return p.a + p.b;
  if (p.op === '×') return p.a * p.b;
  return p.a; // − e ÷ mostram o total
}

/** Motivo de a conta não servir (ou null se está ok). */
export function problemIssue(p: MathProblem): string | null {
  if (p.op === '-' && p.a < p.b) return `subtração com resultado negativo (${p.a} − ${p.b})`;
  if (p.op === '÷' && (p.b === 0 || p.a % p.b !== 0)) return `divisão com resto (${p.a} ÷ ${p.b})`;
  if (!Number.isInteger(p.answer) || p.answer < 0) return `resultado inválido (${p.answer})`;
  if (mobsOnScreen(p) > MAX_ON_SCREEN) return `${mobsOnScreen(p)} mobs na tela (máximo ${MAX_ON_SCREEN})`;
  if (mobsOnScreen(p) < 1) return 'nenhum mob na tela';
  return null;
}

/** Sorteia uma conta válida para a dificuldade (e operação, se informada). */
export function generateProblem(difficulty: Difficulty, op?: MathOp): MathProblem {
  const rules = DIFFICULTY_RULES[difficulty];
  const chosen = op && rules.ops.includes(op) ? op : op ?? pickRandom(rules.ops);
  for (let tries = 0; tries < 200; tries++) {
    let p: MathProblem;
    switch (chosen) {
      case '+':
        p = solve(randInt(1, rules.max), '+', randInt(1, rules.max));
        break;
      case '-': {
        const a = randInt(2, rules.max);
        p = solve(a, '-', randInt(1, a));
        break;
      }
      case '×': {
        const m = Math.max(2, rules.multMax || 3);
        p = solve(randInt(2, m), '×', randInt(2, m));
        break;
      }
      default: {
        const b = randInt(2, 5);
        const q = randInt(1, Math.floor((rules.divMax || 20) / b));
        p = solve(b * q, '÷', b);
      }
    }
    if (!problemIssue(p)) return p;
  }
  return solve(2, '+', 1);
}

/** Resultado com a operação trocada (erro comum): + ↔ −, × → +, ÷ → −. */
function swappedResult(p: MathProblem): number | null {
  switch (p.op) {
    case '+':
      return Math.abs(p.a - p.b);
    case '-':
      return p.a + p.b;
    case '×':
      return p.a + p.b;
    case '÷':
      return p.a - p.b >= 0 ? p.a - p.b : null;
  }
}

/** Alternativas plausíveis: resposta ±1, ±2 e a operação trocada; sem negativos, sem repetir, embaralhadas. */
export function problemOptions(p: MathProblem, count = 4): number[] {
  const wrong = new Set<number>();
  const swapped = swappedResult(p);
  if (swapped !== null && swapped !== p.answer) wrong.add(swapped);
  for (const d of shuffle([1, -1, 2, -2])) {
    if (wrong.size >= count - 1) break;
    const v = p.answer + d;
    if (v >= 0 && v !== p.answer) wrong.add(v);
  }
  let extra = p.answer + 3;
  while (wrong.size < count - 1) {
    if (extra !== p.answer) wrong.add(extra);
    extra++;
  }
  return shuffle([p.answer, ...[...wrong].slice(0, count - 1)]);
}
