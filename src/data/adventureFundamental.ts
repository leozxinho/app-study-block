import { Activity, ActivityCategory, ActivityType, AgeGroup, Difficulty } from '../types';
import { formatMathMobsQuestion, unitByKey } from '../lib/activityParsers/mathMobs';
import type { MathOp, MathProblem } from '../lib/mathGenerator';
import { NEW_TYPE_ACTIVITIES } from './newTypeActivities';

// =============================================
// AVENTURA DO ENSINO FUNDAMENTAL: 100 fases por faixa
//   fundamental-1: 1º e 2º ano (6-7 anos), dificuldade "médio"
//   fundamental-2: 3º ao 5º ano (8-10 anos), dificuldade "difícil"
// As perguntas são geradas a partir de modelos por mundo, com números FIXOS
// (semente), então são sempre as mesmas. A auditoria confere todas.
// =============================================

type FundAge = Extract<AgeGroup, 'fundamental-1' | 'fundamental-2'>;

/** Números "aleatórios" sempre iguais (mulberry32). */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface WorldTheme {
  name: string;
  /** Mob/bloco das contas com mobs (precisa existir em MATH_UNITS) */
  unit: string;
  /** Personagem e objeto dos problemas escritos */
  who: string;
  item: string;
  /** Objeto no masculino ("Quantos cactos") */
  itemMasc?: boolean;
  /** Palavras com figura (src/lib/words.ts) */
  words: string[];
  long: string; // palavra de 3 sílabas para ordenar
}

const WORLDS: WorldTheme[] = [
  { name: 'Vila', unit: 'porco', who: 'Téo', item: 'maçãs', words: ['CASA', 'VACA', 'GATO'], long: 'JANELA' },
  { name: 'Floresta', unit: 'lobo', who: 'Lia', item: 'folhas', words: ['FOLHA', 'FLOR', 'SAPO'], long: 'ABELHA' },
  { name: 'Mina', unit: 'diamante', who: 'O minerador', item: 'pedras', words: ['MINA', 'BOLO', 'MAPA'], long: 'MACACO' },
  { name: 'Deserto', unit: 'ouro', who: 'O explorador', item: 'cactos', itemMasc: true, words: ['CAMELO', 'SOL', 'TATU'], long: 'CAMELO' },
  { name: 'Oceano', unit: 'pedra', who: 'O mergulhador', item: 'conchas', words: ['PEIXE', 'PATO', 'BOLA'], long: 'BALEIA' },
  { name: 'Neve', unit: 'ovelha', who: 'A pinguim Lila', item: 'bolas de neve', words: ['NEVE', 'LUA', 'OVO'], long: 'BANANA' },
  { name: 'Reino de Fogo', unit: 'zumbi', who: 'O guerreiro', item: 'chamas', words: ['FOGO', 'LOBO', 'PORCO'], long: 'GALINHA' },
  { name: 'Castelo', unit: 'esqueleto', who: 'O rei', item: 'moedas', words: ['ESCUDO', 'CASTELO', 'GATO'], long: 'CASTELO' },
  { name: 'Reino das Estrelas', unit: 'estourinho', who: 'O herói', item: 'cristais', itemMasc: true, words: ['LUA', 'OVELHA', 'PEIXE'], long: 'ESCUDO' },
  { name: 'Grande Desafio', unit: 'galinha', who: 'A turma', item: 'estrelas', words: ['ESCOLA', 'GALINHA', 'BANANA'], long: 'ESCOLA' },
];

const SHAPE_QUESTIONS: Record<FundAge, string[]> = {
  'fundamental-1': ['Qual forma tem 3 lados?', 'Toque no hexágono!', 'Qual forma tem 4 lados iguais?', 'Toque no losango!', 'Qual forma tem 5 pontas?'],
  'fundamental-2': ['Qual forma tem 6 lados?', 'Qual forma tem 5 pontas?', 'Qual forma é redonda e sem pontas?', 'Qual forma tem 3 lados e 3 pontas?', 'Toque no oval!'],
};

const RECIPES: Record<FundAge, string[]> = {
  'fundamental-1': ['Monte uma espada de madeira!', 'Monte uma pá de pedra!', 'Monte uma tocha!', 'Monte uma espada de pedra!', 'Monte uma pá de madeira!'],
  'fundamental-2': ['Monte uma picareta de pedra!', 'Monte um machado de pedra!', 'Monte uma picareta de madeira!', 'Monte um machado de madeira!', 'Monte uma espada de pedra!'],
};

// ---------- contas (sempre válidas: sem negativo, divisão exata, máx. 20 mobs) ----------

/**
 * Teto que cresce ao longo da aventura: no 1º mundo (g = 0) os números ficam perto do mínimo,
 * no último (g = 1) chegam ao máximo da faixa. Assim as fases vão do mais fácil ao mais difícil.
 */
function cap(min: number, max: number, g: number): number {
  return Math.max(min, Math.round(min + (max - min) * g));
}

/** Progresso no mundo w (0 a 9): de 0,35 até 1 (o 1º mundo já não é trivial). */
function growthFor(w: number): number {
  return 0.35 + 0.65 * (w / 9);
}

function mobsProblem(age: FundAge, op: MathOp, r: () => number, g = 1): MathProblem {
  const int = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));
  const solve = (a: number, b: number): MathProblem => ({
    a, b, op, answer: op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b,
  });
  const f1 = age === 'fundamental-1';
  switch (op) {
    case '+': return solve(int(2, cap(4, f1 ? 9 : 10, g)), int(2, cap(4, f1 ? 9 : 10, g)));
    case '-': { const a = int(f1 ? 6 : 10, cap(f1 ? 7 : 11, f1 ? 10 : 20, g)); return solve(a, int(1, a - 1)); }
    case '×': return f1 ? solve(int(2, 3), int(2, cap(2, 3, g))) : solve(int(2, cap(3, 5, g)), int(2, cap(2, 4, g)));
    default: { const b = int(2, cap(3, 5, g)); return solve(b * int(2, Math.floor(20 / b)), b); }
  }
}

function writtenProblem(age: FundAge, op: MathOp, t: WorldTheme, r: () => number, g = 1): string {
  const int = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));
  const big = age === 'fundamental-2';
  const quantas = t.itemMasc ? 'Quantos' : 'Quantas';
  switch (op) {
    case '+': {
      const a = int(big ? 15 : 5, cap(big ? 20 : 6, big ? 60 : 12, g));
      return `${t.who} tinha ${a} ${t.item} e ganhou mais ${int(big ? 10 : 3, cap(big ? 12 : 4, big ? 40 : 8, g))}. ${quantas} tem agora?`;
    }
    case '-': {
      const a = int(big ? 30 : 10, cap(big ? 35 : 12, big ? 90 : 20, g));
      return `Havia ${a} ${t.item} e ${int(big ? 5 : 2, a - 1)} foram embora. ${quantas} restam?`;
    }
    case '×':
      return `${t.who} fez ${int(2, cap(3, big ? 9 : 3, g))} grupos de ${int(2, cap(3, big ? 9 : 5, g))} ${t.item}. ${quantas} ao todo?`;
    default: {
      const b = int(2, cap(3, 9, g));
      return `Vamos dividir ${b * int(2, cap(3, 9, g))} ${t.item} por ${b} amigos. ${quantas} cada um ganha?`;
    }
  }
}

function miningQuestion(age: FundAge, op: MathOp, r: () => number, g = 1): string {
  const int = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));
  const big = age === 'fundamental-2';
  switch (op) {
    case '+': return `Minere o resultado: ${int(5, cap(8, big ? 50 : 15, g))} + ${int(2, cap(5, big ? 40 : 10, g))}`;
    case '-': { const a = int(big ? 20 : 8, cap(big ? 25 : 10, big ? 99 : 20, g)); return `Minere o resultado: ${a} - ${int(1, a - 1)}`; }
    case '×': return `Minere o resultado: ${int(2, cap(3, big ? 9 : 3, g))} x ${int(2, cap(3, big ? 9 : 5, g))}`;
    default: { const b = int(2, cap(3, 9, g)); return `Minere o resultado: ${b * int(2, cap(3, 9, g))} ÷ ${b}`; }
  }
}

// ---------- montagem das 100 fases ----------

const OPS: Record<FundAge, MathOp[]> = {
  'fundamental-1': ['+', '-', '+', '-', '×'],
  'fundamental-2': ['+', '-', '×', '÷'],
};

function build(age: FundAge): Activity[] {
  const difficulty: Difficulty = age === 'fundamental-1' ? 'medio' : 'dificil';
  const prefix = age === 'fundamental-1' ? 'f1' : 'f2';
  const basePoints = age === 'fundamental-1' ? 25 : 30;
  const list: Activity[] = [];
  // Perguntas já usadas nesta faixa (para não repetir)
  // (inclui os exemplos da lista de atividades da mesma faixa)
  const used = new Set<string>(NEW_TYPE_ACTIVITIES.filter((x) => x.age_group === age).map((x) => x.question));

  WORLDS.forEach((t, w) => {
    for (let k = 0; k < 10; k++) {
      const n = w * 10 + k + 1;
      const g = growthFor(w);
      const r = seeded((age === 'fundamental-1' ? 1000 : 2000) + n * 7919);
      const ops = OPS[age];
      const op = ops[(w + k) % ops.length];
      const word = t.words[k % t.words.length];
      // valores definidos em gen() abaixo
      let type: ActivityType = 'multiple-choice';
      let category: ActivityCategory = 'matematica';
      let title = '';
      let question = '';
      const rBoss = seeded(n * 104729 + 17);

      const gen = () => {
      switch (k) {
        case 0:
          type = 'multiple-choice'; category = 'matematica'; title = `Problema na ${t.name}`;
          question = writtenProblem(age, op, t, r, g);
          break;
        case 1:
          type = 'word-builder'; category = 'linguagem'; title = `Palavra da ${t.name}`;
          question = age === 'fundamental-1' ? `Monte a palavra ${word}!` : `Que figura é essa? Monte o nome! (${word})`;
          break;
        case 2:
          type = 'math-mobs'; category = 'matematica'; title = `Contas com Mobs: ${t.name}`;
          question = formatMathMobsQuestion(mobsProblem(age, op, r, g), unitByKey(t.unit));
          break;
        case 3:
          if (age === 'fundamental-1') {
            type = 'letter-identification'; category = 'linguagem'; title = `Primeira Letra: ${t.name}`;
            question = `Qual é a primeira letra de ${word}?`;
          } else {
            type = 'ordering'; category = 'linguagem'; title = `Sílabas da ${t.name}`;
            question = `Organize as sílabas para formar a palavra ${t.long}`;
          }
          break;
        case 4: {
          type = 'sequence'; category = 'matematica'; title = `Sequência da ${t.name}`;
          const steps = age === 'fundamental-1' ? [2, 5, 10, 3, 4] : [3, 4, 6, 7, 8, 9, 11, 12, 15, 25];
          const step = steps[(w + k) % steps.length];
          const start = Math.floor(r() * cap(3, age === 'fundamental-1' ? 10 : 30, g));
          question = `Complete a sequência: ${[0, 1, 2, 3].map((i) => start + i * step).join(', ')}, ?`;
          break;
        }
        case 5:
          type = 'mining-math'; category = 'matematica'; title = `Mineração: ${t.name}`;
          question = miningQuestion(age, ops[(w + k + 1) % ops.length], r, g);
          break;
        case 6:
          if (w % 2 === 0) {
            type = 'shape-identification'; category = 'formas'; title = `Formas da ${t.name}`;
            question = SHAPE_QUESTIONS[age][(w / 2) % SHAPE_QUESTIONS[age].length];
          } else {
            type = 'build-pattern'; category = 'coordenacao'; title = `Construção na ${t.name}`;
            question = `Copie a construção da ${t.name} ${age === 'fundamental-1' ? '3x3' : '4x4'}!`;
          }
          break;
        case 7:
          if (w % 2 === 0) {
            type = 'crafting'; category = 'desafios'; title = `Crafting na ${t.name}`;
            question = RECIPES[age][(w / 2) % RECIPES[age].length];
          } else {
            type = 'shadow-match'; category = 'formas'; title = `Sombras da ${t.name}`;
            question = `Ligue cada mob da ${t.name} à sua sombra!`;
          }
          break;
        case 8: {
          type = 'ordering'; category = 'matematica'; title = `Ordem na ${t.name}`;
          const count = age === 'fundamental-1' ? 4 : 5;
          const max = cap(age === 'fundamental-1' ? 10 : 30, age === 'fundamental-1' ? 20 : 99, g);
          const nums = new Set<number>();
          while (nums.size < count) nums.add(1 + Math.floor(r() * max));
          question = `Ordene do menor para o maior: ${[...nums].join(', ')}`;
          break;
        }
        default: {
          // Chefe do mundo: a operação mais difícil da faixa
          const bossOp: MathOp = age === 'fundamental-1' ? (w % 2 ? '×' : '-') : w % 2 ? '÷' : '×';
          type = 'math-mobs'; category = 'matematica'; title = `Desafio Final: ${t.name}`;
          // semente própria para não repetir as contas de exemplo
          question = formatMathMobsQuestion(mobsProblem(age, bossOp, rBoss, g), unitByKey(t.unit));
        }
      }
      };
      // Sorteia de novo se a pergunta já existe na faixa (os sorteios continuam determinísticos)
      gen();
      for (let tries = 0; used.has(question) && tries < 20; tries++) gen();
      used.add(question);

      list.push({
        id: `adv-${prefix}-${n}`,
        title,
        description: `Fase ${n} da aventura no mundo ${t.name}.`,
        age_group: age,
        category,
        difficulty,
        activity_type: type,
        question,
        image_url: '',
        points: basePoints + w,
        order_index: n,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  });
  return list;
}

export const ADVENTURE_ACTIVITIES_FUNDAMENTAL_1 = build('fundamental-1');
export const ADVENTURE_ACTIVITIES_FUNDAMENTAL_2 = build('fundamental-2');
