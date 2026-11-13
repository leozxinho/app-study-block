import type { Activity } from '../../types';
import { pickRandom, shuffle } from '../random';
import { hasWord, normalize, wordIndex } from '../text';
import type { ParseMeta } from './common';

// =============================================================
// CORES
// =============================================================

export interface ColorDef {
  name: string;
  label: string;
  /** Formas que a pergunta pode usar (feminino, etc.) */
  aliases: string[];
  bg: string;
  text: string;
  emoji: string;
  hint: string;
  /** Básica = entra como distrator para os menores */
  basic: boolean;
}

export const COLORS: ColorDef[] = [
  { name: 'vermelho', label: 'Vermelho', aliases: ['vermelho', 'vermelha', 'vermelhos', 'vermelhas'], bg: 'bg-red-600', text: 'text-white', emoji: '🟥', hint: 'a cor do morango e do bloco de redstone', basic: true },
  { name: 'azul', label: 'Azul', aliases: ['azul', 'azuis'], bg: 'bg-blue-600', text: 'text-white', emoji: '🟦', hint: 'a cor do céu e da água', basic: true },
  { name: 'verde', label: 'Verde', aliases: ['verde', 'verdes'], bg: 'bg-green-600', text: 'text-white', emoji: '🟩', hint: 'a cor da grama e das folhas', basic: true },
  { name: 'amarelo', label: 'Amarelo', aliases: ['amarelo', 'amarela', 'amarelos', 'amarelas'], bg: 'bg-yellow-300', text: 'text-gray-900', emoji: '🟨', hint: 'a cor do sol e da banana', basic: true },
  { name: 'roxo', label: 'Roxo', aliases: ['roxo', 'roxa', 'roxos', 'roxas'], bg: 'bg-purple-600', text: 'text-white', emoji: '🟪', hint: 'a cor da uva e do portal mágico', basic: true },
  { name: 'laranja', label: 'Laranja', aliases: ['laranja', 'laranjas'], bg: 'bg-orange-400', text: 'text-gray-900', emoji: '🟧', hint: 'a cor da laranja e da lava', basic: true },
  { name: 'rosa', label: 'Rosa', aliases: ['rosa', 'rosas', 'cor-de-rosa'], bg: 'bg-pink-400', text: 'text-gray-900', emoji: '🩷', hint: 'a cor do porquinho', basic: false },
  { name: 'branco', label: 'Branco', aliases: ['branco', 'branca', 'brancos', 'brancas'], bg: 'bg-white', text: 'text-gray-900', emoji: '⬜', hint: 'a cor da neve e da nuvem', basic: false },
  { name: 'marrom', label: 'Marrom', aliases: ['marrom', 'marrons'], bg: 'bg-amber-800', text: 'text-white', emoji: '🟫', hint: 'a cor da terra e do tronco da árvore', basic: false },
  { name: 'cinza', label: 'Cinza', aliases: ['cinza', 'cinzas', 'cinzento'], bg: 'bg-gray-500', text: 'text-white', emoji: '🩶', hint: 'a cor da pedra', basic: false },
  { name: 'preto', label: 'Preto', aliases: ['preto', 'preta', 'pretos', 'pretas'], bg: 'bg-gray-900', text: 'text-white', emoji: '⬛', hint: 'a cor do carvão e da noite', basic: false },
  { name: 'dourado', label: 'Dourado', aliases: ['dourado', 'dourada', 'dourados', 'douradas'], bg: 'bg-gradient-to-br from-yellow-300 to-amber-500', text: 'text-gray-900', emoji: '🥇', hint: 'a cor do ouro, que brilha', basic: false },
];

/** Cores parecidas não aparecem juntas (confunde). */
const SIMILAR: Record<string, string[]> = {
  dourado: ['amarelo', 'laranja'],
  amarelo: ['dourado'],
  laranja: ['dourado'],
  branco: ['cinza'],
  cinza: ['branco'],
  rosa: ['vermelho'],
  vermelho: ['rosa'],
};

export interface ColorData extends ParseMeta {
  target: ColorDef;
  fromQuestion: boolean;
  options: ColorDef[];
}

/** Acha a cor citada (a primeira que aparece no texto). */
export function findColor(text: string): ColorDef | null {
  let best: { c: ColorDef; at: number } | null = null;
  for (const c of COLORS) {
    for (const alias of c.aliases) {
      const at = wordIndex(text, alias);
      if (at >= 0 && (!best || at < best.at)) best = { c, at };
    }
  }
  return best?.c ?? null;
}

export function parseColor(activity: Pick<Activity, 'question'>): ColorData {
  const found = findColor(activity.question);
  const target = found ?? pickRandom(COLORS.filter((c) => c.basic));
  const pool = COLORS.filter(
    (c) => c.name !== target.name && !(SIMILAR[target.name] ?? []).includes(c.name) && (c.basic || !target.basic)
  );
  return {
    recognized: Boolean(found),
    note: found ? undefined : 'a pergunta não diz a cor (é sorteada e mostrada no subtítulo)',
    target,
    fromQuestion: Boolean(found),
    options: shuffle([target, ...shuffle(pool).slice(0, 3)]),
  };
}

// =============================================================
// FORMAS
// =============================================================

export type ShapeId = 'quadrado' | 'circulo' | 'triangulo' | 'retangulo' | 'estrela' | 'losango' | 'hexagono' | 'oval';

export interface ShapeDef {
  id: ShapeId;
  label: string;
  aliases: string[];
  hint: string;
  basic: boolean;
}

export const SHAPES: ShapeDef[] = [
  { id: 'quadrado', label: 'Quadrado', aliases: ['quadrado', 'quadrados', 'quadrada'], hint: 'o quadrado tem 4 lados do mesmo tamanho, igual a um bloco.', basic: true },
  { id: 'circulo', label: 'Círculo', aliases: ['circulo', 'circulos', 'redondo', 'redonda'], hint: 'o círculo é redondo, como uma bola. Não tem pontas.', basic: true },
  { id: 'triangulo', label: 'Triângulo', aliases: ['triangulo', 'triangulos'], hint: 'o triângulo tem 3 lados e 3 pontas.', basic: true },
  { id: 'retangulo', label: 'Retângulo', aliases: ['retangulo', 'retangulos'], hint: 'o retângulo tem 4 lados, mas é mais comprido que alto.', basic: true },
  { id: 'estrela', label: 'Estrela', aliases: ['estrela', 'estrelas'], hint: 'a estrela tem 5 pontas.', basic: false },
  { id: 'losango', label: 'Losango', aliases: ['losango', 'losangos'], hint: 'o losango parece um quadrado de ponta-cabeça, como uma pipa.', basic: false },
  { id: 'hexagono', label: 'Hexágono', aliases: ['hexagono', 'hexagonos'], hint: 'o hexágono tem 6 lados, como o favo de mel.', basic: false },
  { id: 'oval', label: 'Oval', aliases: ['oval', 'ovais'], hint: 'o oval é redondo e comprido, como um ovo.', basic: false },
];

export interface ShapeData extends ParseMeta {
  target: ShapeDef;
  options: ShapeDef[];
}

/** Acha a forma pedida: atributos ("3 lados"), "é um X", "toque no X", ou a primeira citada. */
export function findShape(question: string): ShapeDef | null {
  const q = normalize(question);
  const byId = (id: ShapeId) => SHAPES.find((s) => s.id === id)!;
  if (/(3|tres) lados/.test(q)) return byId('triangulo');
  if (/(6|seis) lados/.test(q)) return byId('hexagono');
  if (/(5|cinco) pontas/.test(q)) return byId('estrela');
  if (/4 lados iguais|quatro lados iguais/.test(q)) return byId('quadrado');
  if (/sem pontas/.test(q)) return byId('circulo');

  const cue = q.match(/(?:e|parece|lembra)\s+(?:um|uma)\s+([a-z-]+)/) ?? q.match(/toque\s+n[oa]\s+([a-z-]+)/);
  if (cue) {
    const s = SHAPES.find((x) => x.aliases.includes(cue[1]));
    if (s) return s;
  }
  let best: { s: ShapeDef; at: number } | null = null;
  for (const s of SHAPES) {
    for (const alias of s.aliases) {
      const at = wordIndex(q, alias);
      if (at >= 0 && (!best || at < best.at)) best = { s, at };
    }
  }
  return best?.s ?? null;
}

export function parseShape(activity: Pick<Activity, 'question' | 'age_group'>): ShapeData {
  const found = findShape(activity.question);
  const target = found ?? SHAPES[0];
  const young = activity.age_group === 'bercario' || activity.age_group === 'maternal';
  const pool = SHAPES.filter((s) => s.id !== target.id && (s.basic || !young || !target.basic));
  // Formas com nomes de várias formas na pergunta: avisa (pode ser ambígua)
  const mentioned = SHAPES.filter((s) => s.aliases.some((a) => hasWord(activity.question, a)));
  const ambiguous = mentioned.length > 1 && !/(?:e|parece|lembra)\s+(?:um|uma)|toque n[oa]/.test(normalize(activity.question));
  return {
    recognized: Boolean(found) && !ambiguous,
    note: !found ? 'a pergunta não diz a forma (resposta vira "quadrado")' : ambiguous ? `cita várias formas (${mentioned.map((m) => m.label).join(', ')})` : undefined,
    target,
    options: shuffle([target, ...shuffle(pool).slice(0, 3)]),
  };
}

// =============================================================
// LETRAS
// =============================================================

export interface LetterOption {
  letter: string;
  isCorrect: boolean;
}

export interface LetterData extends ParseMeta {
  options: LetterOption[];
  correct: string;
  hint: string;
  word?: string;
}

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'X', 'Z'];
const ALPHABET = [...VOWELS, ...CONSONANTS];

function letterOptions(correct: string, preferWrong: string[] = []): LetterOption[] {
  const wrong = Array.from(new Set(preferWrong.filter((l) => l !== correct && ALPHABET.includes(l))));
  for (const l of shuffle(ALPHABET)) {
    if (wrong.length >= 3) break;
    if (l !== correct && !wrong.includes(l)) wrong.push(l);
  }
  return shuffle([correct, ...wrong.slice(0, 3)]).map((letter) => ({ letter, isCorrect: letter === correct }));
}

/** Palavra da pergunta "primeira letra de X" / "qual letra começa (a palavra) X". */
export function findLetterWord(question: string): string | null {
  const m =
    question.match(/primeira letra d[aeo]\s+(?:palavra\s+)?([\p{L}]+)/iu) ??
    question.match(/(?:qual letra|letra que)\s+(?:começa|inicia)\s+(?:a\s+palavra\s+|o\s+nome\s+|a\s+|o\s+)?([\p{L}]+)/iu);
  return m ? m[1] : null;
}

export function parseLetter(activity: Pick<Activity, 'question'>): LetterData {
  const word = findLetterWord(activity.question);
  if (word && word.length > 2) {
    const correct = normalize(word[0]).toUpperCase();
    const rest = normalize(word.slice(1)).toUpperCase().split('');
    return {
      recognized: true, word, correct, options: letterOptions(correct, rest),
      hint: `fale "${word.toLowerCase()}" bem devagar e escute o primeiro som.`,
    };
  }
  const q = activity.question.toLowerCase();
  if (q.includes('consoante')) {
    const correct = pickRandom(CONSONANTS);
    return {
      recognized: true, correct, hint: 'consoante é a letra que NÃO é A, E, I, O, U.',
      options: shuffle([correct, ...shuffle(VOWELS).slice(0, 3)]).map((letter) => ({ letter, isCorrect: letter === correct })),
    };
  }
  const isVowelQ = q.includes('vogal') || q.includes('vogais');
  const correct = pickRandom(VOWELS);
  return {
    recognized: isVowelQ,
    note: isVowelQ ? undefined : 'pergunta de letra não reconhecida (vira "escolha a vogal")',
    correct, hint: 'as vogais são A, E, I, O, U.',
    options: shuffle([correct, ...shuffle(CONSONANTS).slice(0, 3)]).map((letter) => ({ letter, isCorrect: letter === correct })),
  };
}
