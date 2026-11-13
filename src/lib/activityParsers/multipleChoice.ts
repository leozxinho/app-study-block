import type { Activity } from '../../types';
import { shuffle, rand } from '../random';
import { numbersIn } from '../text';
import { numericOptions, type ChoiceOption, type ParseMeta } from './common';

import type { MathOp, MathProblem } from '../mathGenerator';
export type { MathOp, MathProblem } from '../mathGenerator';

export interface MultipleChoiceData extends ParseMeta {
  kind: 'math' | 'mix' | 'next' | 'unknown';
  options: ChoiceOption[];
  correct: string;
  hint: string;
  math?: MathProblem;
}

const SUB_WORDS = /(deu|perdeu|usou|gastou|comeu|apag|fugi|sa[ií]ram|foram embora|sobr|rest|ficou|ficaram|tirou|derret|vendeu|quebraram|caiu|ca[ií]ram)/;
const ADD_WORDS = /(mais|ganhou|achou|encontrou|juntou|total|ao todo|e depois|depois|chegaram|\be\b)/;

function solve(a: number, op: MathOp, b: number): MathProblem {
  const answer = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
  return { a, b, op, answer };
}

/**
 * Lê uma conta de um texto. Aceita:
 *  "3 + 4", "2 esmeraldas + 3 rubis", "15 flocos de neve - 7", "3 x 4", "3 grupos de 2",
 *  "dobro de 4", "metade de 8", "dividir 12 por 3",
 *  problemas com 2 números ("tinha 8 e perdeu 3", "8 de manhã e 5 à tarde").
 */
export function parseMath(question: string): MathProblem | null {
  const q = question.toLowerCase();
  // número, palavras opcionais, operador, número
  const sym = q.match(/(\d+)[^\d+\-×÷=?!]*?([+\-×÷])\s*(\d+)/);
  if (sym) return solve(+sym[1], sym[2] as MathOp, +sym[3]);
  const times = q.match(/(\d+)\s*(?:x|vezes)\s*(\d+)/) ?? q.match(/(\d+)\s+grupos?\s+de\s+(\d+)/);
  if (times) return solve(+times[1], '×', +times[2]);
  const dobro = q.match(/(dobro|triplo)\s+d[eoa]s?\s+(\d+)/);
  if (dobro) return solve(+dobro[2], '×', dobro[1] === 'dobro' ? 2 : 3);
  const metade = q.match(/metade\s+d[eoa]s?\s+(\d+)/);
  if (metade) return solve(+metade[1], '÷', 2);
  const div = q.match(/divid\w*\s+(\d+)\D+?(\d+)/) ?? q.match(/(\d+)\D+?divid\w*\D+?(\d+)/);
  if (div) return solve(+div[1], '÷', +div[2]);

  const n = numbersIn(q);
  if (n.length !== 2) return null;
  if (SUB_WORDS.test(q)) return solve(n[0], '-', n[1]);
  if (ADD_WORDS.test(q)) return solve(n[0], '+', n[1]);
  return null;
}

const MIXES: { colors: [string, string]; result: string }[] = [
  { colors: ['azul', 'amarelo'], result: 'Verde' },
  { colors: ['vermelho', 'azul'], result: 'Roxo' },
  { colors: ['vermelho', 'amarelo'], result: 'Laranja' },
  { colors: ['vermelho', 'branco'], result: 'Rosa' },
  { colors: ['preto', 'branco'], result: 'Cinza' },
];
const MIX_COLORS = ['Verde', 'Roxo', 'Laranja', 'Rosa', 'Cinza', 'Marrom'];

function textOptions(correct: string, wrong: string[]): ChoiceOption[] {
  return shuffle([correct, ...wrong]).map((text, i) => ({ id: String(i + 1), text, isCorrect: text === correct }));
}

export function parseMultipleChoice(activity: Pick<Activity, 'question'>): MultipleChoiceData {
  const q = activity.question.toLowerCase();

  // 1) "vem depois/antes de N" e listas "2, 4, 6, vem depois?"
  const after = q.match(/depois\s+d[oe]\s+(\d+)/);
  const before = q.match(/antes\s+d[oe]\s+(\d+)/);
  const list = numbersIn(q);
  if ((q.includes('vem depois') || q.includes('próximo')) && list.length >= 2) {
    const answer = list[list.length - 1] + (list[1] - list[0]);
    if (answer >= 0) {
      return {
        kind: 'next', recognized: true, correct: String(answer), hint: 'veja quanto aumenta de um número para o outro.',
        options: numericOptions(answer).map((v, i) => ({ id: String(i + 1), text: String(v), isCorrect: v === answer })).sort(() => rand() - 0.5),
      };
    }
  }
  if (after || before) {
    const answer = after ? +after[1] + 1 : +before![1] - 1;
    if (answer >= 0) {
      return {
        kind: 'next', recognized: true, correct: String(answer),
        hint: after ? `conte a partir do ${after[1]}: o próximo é um a mais.` : `conte para trás a partir do ${before![1]}.`,
        options: shuffle(numericOptions(answer)).map((v, i) => ({ id: String(i + 1), text: String(v), isCorrect: v === answer })),
      };
    }
  }

  // 2) contas
  const math = parseMath(q);
  if (math) {
    const valid = Number.isInteger(math.answer) && math.answer >= 0;
    if (valid) {
      const hint =
        math.op === '+' ? `comece no ${math.a} e conte mais ${math.b}.`
        : math.op === '-' ? `comece no ${math.a} e tire ${math.b}.`
        : math.op === '×' ? `some o ${math.a}, ${math.b} vezes.`
        : `reparta ${math.a} em ${math.b} grupos iguais.`;
      return {
        kind: 'math', recognized: true, math, correct: String(math.answer), hint,
        options: shuffle(numericOptions(math.answer)).map((v, i) => ({ id: String(i + 1), text: String(v), isCorrect: v === math.answer })),
      };
    }
    return {
      kind: 'unknown', recognized: false,
      note: math.answer < 0 ? `conta dá negativo (${math.a} ${math.op} ${math.b})` : `divisão com resto (${math.a} ÷ ${math.b})`,
      options: textOptions('Sim', ['Não']), correct: 'Sim', hint: 'leia a pergunta de novo.',
    };
  }

  // 3) mistura de cores
  if (q.includes('mistur')) {
    const mix = MIXES.find((m) => m.colors.every((c) => q.includes(c)));
    if (mix) {
      return {
        kind: 'mix', recognized: true, correct: mix.result, hint: 'pense em duas tintas se juntando num pote.',
        options: textOptions(mix.result, shuffle(MIX_COLORS.filter((c) => c !== mix.result)).slice(0, 3)),
      };
    }
  }

  return {
    kind: 'unknown', recognized: false, note: 'pergunta de múltipla escolha não reconhecida',
    options: textOptions('Sim', ['Não', 'Talvez', 'Nenhuma']), correct: 'Sim', hint: 'leia a pergunta de novo, bem devagar.',
  };
}

/** Contas para as rodadas extras (mesma operação, números parecidos). */
export function makeMathQuestion(op: MathOp, maxN: number): string {
  for (;;) {
    const a = 1 + Math.floor(rand() * maxN);
    const b = 1 + Math.floor(rand() * maxN);
    if (op === '-' && a - b < 0) continue;
    if (op === '÷' && (b === 0 || a % b !== 0)) continue;
    return `Quanto é ${a} ${op} ${b}?`;
  }
}

export { MIXES };
