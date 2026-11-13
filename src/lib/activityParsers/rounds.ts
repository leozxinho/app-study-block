import type { Activity } from '../../types';
import { pickRandom, randInt, sample, seedFromText, shuffle, withSeed } from '../random';
import { stripNumberHints } from '../text';
import { WORDS } from '../words';
import { ageCountRange } from './common';
import { COLORS, SHAPES, findLetterWord, parseColor, parseShape } from './colorShapeLetter';
import { parseCounting } from './counting';
import { makeMathQuestion, parseMultipleChoice, MIXES } from './multipleChoice';
import { makeSequenceQuestion, parseOrdering, parseSequence } from './sequenceOrdering';
import { DELIVER_NOUNS, RECIPES, buildSize, otherWords, parseCrafting, parseDragDrop, parseMiningMath, parseWordBuilder, shadowCount } from './building';
import { clickSiblings, parseClick, MEMORY_PAIRS } from './picking';
import { MATH_MOBS_ROUNDS, mathMobsVariant } from './mathMobs';
import { pickByLevel, type Adaptive } from '../adaptive';

// =============================================================
// Rodadas: cada atividade tem pelo menos MIN_TASKS tarefas.
// Tarefa = uma resposta da criança (escolher uma opção, colocar uma peça, achar um par).
// A 1ª rodada é a pergunta original; as outras são variações do mesmo tipo.
// =============================================================

export const MIN_TASKS = 5;

/** Quantas respostas a criança dá numa rodada deste tipo. */
export function tasksPerRound(a: Activity): number {
  switch (a.activity_type) {
    case 'memory':
      return MEMORY_PAIRS;
    case 'shadow-match':
      return shadowCount(a);
    case 'ordering':
      return parseOrdering(a).items.length;
    case 'drag-drop':
      return parseDragDrop(a).slots;
    case 'word-builder':
      return parseWordBuilder(a).pieces.length;
    case 'crafting':
      return parseCrafting(a).cells.filter(Boolean).length;
    case 'build-pattern': {
      const s = buildSize(a).size;
      return s * s;
    }
    default:
      return 1;
  }
}

export function roundCount(a: Activity): number {
  // Contas com mobs: 8 tarefas por atividade
  if (a.activity_type === 'math-mobs') return MATH_MOBS_ROUNDS;
  return Math.max(1, Math.ceil(MIN_TASKS / Math.max(1, tasksPerRound(a))));
}

/** Pergunta de uma rodada extra (null = repete a original, que já é sorteada a cada vez). */
function variantQuestion(a: Activity, i: number): string | null {
  const q = a.question;
  switch (a.activity_type) {
    case 'multiple-choice': {
      const p = parseMultipleChoice(a);
      if (p.kind === 'math' && p.math) {
        const max = Math.max(5, Math.min(20, Math.max(p.math.a, p.math.b) + 2));
        return makeMathQuestion(p.math.op, p.math.op === '×' || p.math.op === '÷' ? Math.min(max, 6) : max);
      }
      if (p.kind === 'next') {
        const n = randInt(1, 15);
        return pickRandom([`Qual número vem depois de ${n}?`, `Qual número vem antes de ${n + 1}?`]);
      }
      if (p.kind === 'mix') {
        const m = MIXES[i % MIXES.length];
        return `Qual cor aparece ao misturar ${m.colors[0]} e ${m.colors[1]}?`;
      }
      return null;
    }
    case 'counting': {
      // mesma pergunta, sem número fixo: a quantidade muda a cada rodada
      const [lo, hi] = ageCountRange(a);
      const [qlo, qhi] = parseCounting(a).range;
      const base = stripNumberHints(q);
      return qlo === qhi ? `${base} (${Math.max(1, Math.min(lo, qlo - 2))}-${Math.max(hi, qhi)})` : null;
    }
    case 'color-identification': {
      const target = parseColor(a).target;
      const pool = COLORS.filter((c) => c.name !== target.name && (c.basic || a.age_group !== 'bercario'));
      return `Toque no bloco ${pickRandom(pool).name}!`;
    }
    case 'shape-identification': {
      const target = parseShape(a).target;
      const young = a.age_group === 'bercario' || a.age_group === 'maternal';
      const pool = SHAPES.filter((s) => s.id !== target.id && (s.basic || !young));
      const s = pickRandom(pool);
      return `Toque no ${s.label.toLowerCase()}!`.replace('Toque no estrela', 'Toque na estrela');
    }
    case 'letter-identification': {
      if (!findLetterWord(q)) return null; // vogal/consoante já sorteia
      return `Qual é a primeira letra de ${pickRandom(WORDS.filter((w) => w.word.length <= 6)).word}?`;
    }
    case 'sequence': {
      const p = parseSequence(a);
      if (p.pattern[0]?.isNumber) {
        const n = p.pattern.map((x) => +x.value);
        return makeSequenceQuestion('number', Math.abs(n[1] - n[0]) || 1);
      }
      return makeSequenceQuestion('symbol');
    }
    case 'ordering': {
      const p = parseOrdering(a);
      if (p.kind === 'syllables') {
        const w = pickRandom(WORDS.filter((x) => x.syllables.length >= 2 && x.word !== p.word));
        return `Organize as sílabas para formar a palavra ${w.word}`;
      }
      if (p.kind === 'letters' && p.word) return `Organize as letras para formar a palavra ${pickRandom(otherWords(p.word, 5)).word}`;
      if (p.kind === 'letters') return `Ordene as letras: ${shuffle(sample('ABCDEFGHIJLMNOPRSTUV'.split(''), p.items.length)).join(', ')}!`;
      if (p.kind === 'numbers') {
        const max = Math.max(10, ...p.items.map((x) => +x.text));
        return `Ordene do menor para o maior: ${sample(Array.from({ length: max }, (_, k) => k + 1), p.items.length).join(', ')}`;
      }
      return null;
    }
    case 'click-correct': {
      const p = parseClick(a);
      if (/n[uú]mero\s+\d+/i.test(q)) return `Toque no número ${randInt(1, 9)}!`;
      // genéricos ("animal", "brilhante", "maior", "qualquer bloco") já sorteiam a cada vez
      const siblings = p.target && !p.anyCorrect && !/(animal|bicho|brilh|luz|maior)/i.test(q) ? clickSiblings(p.target) : [];
      return siblings.length ? `Encontre: ${pickRandom(siblings).label}!` : null;
    }
    case 'drag-drop': {
      const p = parseDragDrop(a);
      if (p.mode === 'syllables') {
        const w = pickRandom(WORDS.filter((x) => x.syllables.length >= 2));
        return `Forme a palavra: ${w.syllables.join(' + ')}`;
      }
      if (p.mode === 'deliver') {
        const pairs: [string, string][] = [['o osso', 'o lobo'], ['a cenoura', 'o coelho'], ['a semente', 'a galinha'], ['a chave', 'o baú'], ['a comida', 'o peixe'], ['a picareta', 'a gema']];
        const [x, y] = pickRandom(pairs);
        return `Arraste ${x} até ${y}!`;
      }
      return null;
    }
    case 'crafting': {
      const cur = parseCrafting(a);
      const same = RECIPES.filter((r) => r.tier === a.difficulty && r.tool !== cur.tool);
      const r = pickRandom(same.length ? same : RECIPES.filter((x) => x.tool !== cur.tool));
      return `Monte ${r.name}!`;
    }
    case 'mining-math': {
      const p = parseMiningMath(a).problem;
      const max = a.difficulty === 'facil' ? 5 : a.difficulty === 'medio' ? 9 : 15;
      return `Minere o resultado: ${makeMathQuestion(p.op, p.op === '×' ? 6 : max).replace('Quanto é ', '').replace('?', '')}`;
    }
    case 'math-mobs':
      return mathMobsVariant(a);
    case 'word-builder': {
      const p = parseWordBuilder(a);
      const w = pickRandom(otherWords(p.word, p.bySyllable ? 8 : Math.max(5, p.word.length)));
      if (p.bySyllable) return `Monte com sílabas: ${w.syllables.join('-')}`;
      if (/\(/.test(q)) return `Que figura é essa? Monte o nome! (${w.word})`;
      return `Monte a palavra ${w.word}!`;
    }
    default:
      return null;
  }
}

/** Variações fixas a mais do que o necessário (o sorteio não fica sempre igual). */
export const EXTRA_VARIANTS = 3;

/**
 * Variações FIXAS da atividade: geradas sempre iguais (semente = id da atividade), para que
 * todas tenham voz gravada (scripts/exportVoiceLines.ts exporta os textos). A cada partida o
 * jogo sorteia entre elas. Vazia quando o tipo repete a pergunta original.
 */
export function variantPool(activity: Activity): string[] {
  const need = roundCount(activity) - 1;
  if (need <= 0) return [];
  const size = need + EXTRA_VARIANTS;
  const seed = seedFromText(activity.id);
  const pool: string[] = [];
  const used = new Set([activity.question]);
  for (let j = 0; j < size * 4 && pool.length < size; j++) {
    const q = withSeed(seed + j * 7919, () => variantQuestion(activity, j + 2));
    if (q === null) break; // este tipo repete a pergunta original
    if (!used.has(q)) {
      used.add(q);
      pool.push(q);
    }
  }
  return pool;
}

/**
 * Lista de rodadas da atividade (a 1ª é a original; as outras sorteadas das variações fixas).
 * As extras ganham id "<id>#2", "<id>#3"... (só na tela; o progresso salva o id original).
 */
export function buildRounds(activity: Activity, level: Adaptive = 'normal'): Activity[] {
  const n = roundCount(activity);
  // Dificuldade adaptativa: escolhe entre as variações fixas as mais fáceis ou as mais difíceis
  const picked = pickByLevel(variantPool(activity), n - 1, level, shuffle);
  const rounds: Activity[] = [activity];
  for (let i = 2; i <= n; i++) {
    rounds.push({ ...activity, id: `${activity.id}#${i}`, question: picked[i - 2] ?? activity.question });
  }
  return rounds;
}

/** Id original de uma rodada ("abc#3" → "abc"). */
export function baseActivityId(id: string): string {
  return id.split('#')[0];
}

export { DELIVER_NOUNS };
