import { Activity, ActivityCategory, ActivityType, AgeGroup, Difficulty } from '../types';

// =============================================
// Atividades de exemplo dos 5 tipos novos
// crafting · mining-math · word-builder · shadow-match · build-pattern
// Mesmo formato das outras: a pergunta (question) diz o que montar/resolver.
// =============================================

const POINTS: Record<Difficulty, number> = { facil: 10, medio: 15, dificil: 20 };

function make(
  id: string,
  age_group: AgeGroup,
  difficulty: Difficulty,
  activity_type: ActivityType,
  category: ActivityCategory,
  title: string,
  description: string,
  question: string,
  order_index: number
): Activity {
  return {
    id,
    title,
    description,
    age_group,
    category,
    difficulty,
    activity_type,
    question,
    image_url: '',
    points: POINTS[difficulty],
    order_index,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const NEW_TYPE_ACTIVITIES: Activity[] = [
  // ---------- CRAFTING (receitas na grade 3x3) ----------
  make('craft-mat-1', 'maternal', 'facil', 'crafting', 'desafios', 'Meu Primeiro Graveto', 'Copie a receita e crie um graveto!', 'Monte um graveto com as tábuas!', 60),
  make('craft-mat-2', 'maternal', 'facil', 'crafting', 'desafios', 'Mesa de Trabalho', 'Quatro tábuas viram uma mesa!', 'Monte uma mesa de trabalho!', 61),
  make('craft-pre1-1', 'pre-escola-1', 'facil', 'crafting', 'desafios', 'Luz na Caverna', 'Crie uma tocha para iluminar!', 'Monte uma tocha!', 60),
  make('craft-pre1-2', 'pre-escola-1', 'medio', 'crafting', 'desafios', 'Espada de Madeira', 'Siga a receita da espada!', 'Monte uma espada de madeira!', 61),
  make('craft-pre1-3', 'pre-escola-1', 'medio', 'crafting', 'desafios', 'Pá de Pedra', 'Uma pá para cavar!', 'Monte uma pá de pedra!', 62),
  make('craft-pre2-1', 'pre-escola-2', 'dificil', 'crafting', 'desafios', 'Picareta de Pedra', 'A ferramenta de todo minerador!', 'Monte uma picareta de pedra!', 60),
  make('craft-pre2-2', 'pre-escola-2', 'dificil', 'crafting', 'desafios', 'Machado de Pedra', 'Para cortar árvores!', 'Monte um machado de pedra!', 61),

  // ---------- MINING MATH (minerar o bloco com a resposta) ----------
  make('mine-mat-1', 'maternal', 'facil', 'mining-math', 'matematica', 'Mina do 3', 'Ache o bloco com a resposta!', 'Minere o resultado: 1 + 2', 60),
  make('mine-mat-2', 'maternal', 'facil', 'mining-math', 'matematica', 'Mina do 4', 'Ache o bloco com a resposta!', 'Minere o resultado: 2 + 2', 61),
  make('mine-pre1-1', 'pre-escola-1', 'medio', 'mining-math', 'matematica', 'Mina de Somar', 'Some e minere!', 'Minere o resultado: 4 + 3', 63),
  make('mine-pre1-2', 'pre-escola-1', 'medio', 'mining-math', 'matematica', 'Mina de Tirar', 'Tire e minere!', 'Minere o resultado: 8 - 3', 64),
  make('mine-pre2-1', 'pre-escola-2', 'dificil', 'mining-math', 'matematica', 'Mina Profunda', 'Uma conta maior!', 'Minere o resultado: 9 + 7', 62),
  make('mine-pre2-2', 'pre-escola-2', 'dificil', 'mining-math', 'matematica', 'Mina Escura', 'Quanto sobra?', 'Minere o resultado: 15 - 8', 63),
  make('mine-pre2-3', 'pre-escola-2', 'dificil', 'mining-math', 'matematica', 'Mina das Vezes', 'Grupos iguais!', 'Minere o resultado: 3 x 4', 64),

  // ---------- WORD BUILDER (montar palavra; sílabas para os menores) ----------
  make('word-mat-1', 'maternal', 'facil', 'word-builder', 'linguagem', 'Sílabas da Casa', 'Junte as sílabas!', 'Monte com sílabas: CA-SA', 62),
  make('word-mat-2', 'maternal', 'facil', 'word-builder', 'linguagem', 'Sílabas da Bola', 'Junte as sílabas!', 'Monte com sílabas: BO-LA', 63),
  make('word-pre1-1', 'pre-escola-1', 'medio', 'word-builder', 'linguagem', 'Palavra Porco', 'Letra por letra!', 'Monte a palavra PORCO!', 65),
  make('word-pre1-2', 'pre-escola-1', 'medio', 'word-builder', 'linguagem', 'Palavra Vaca', 'Letra por letra!', 'Monte a palavra VACA!', 66),
  make('word-pre1-3', 'pre-escola-1', 'medio', 'word-builder', 'linguagem', 'Palavra Lobo', 'Letra por letra!', 'Monte a palavra LOBO!', 67),
  make('word-pre2-1', 'pre-escola-2', 'dificil', 'word-builder', 'linguagem', 'Quem é?', 'Olhe a figura e escreva o nome!', 'Que animal é esse? Monte o nome! (OVELHA)', 65),
  make('word-pre2-2', 'pre-escola-2', 'dificil', 'word-builder', 'linguagem', 'Quem é? 2', 'Olhe a figura e escreva o nome!', 'Que animal é esse? Monte o nome! (GALINHA)', 66),

  // ---------- SHADOW MATCH (ligar mob à sombra) ----------
  make('shadow-ber-1', 'bercario', 'facil', 'shadow-match', 'formas', 'Cadê a Sombra?', 'Toque no bicho e na sombra dele!', 'Toque no animal e depois na sombra dele!', 60),
  make('shadow-mat-1', 'maternal', 'facil', 'shadow-match', 'formas', 'Sombras da Fazenda', 'Cada animal tem sua sombra!', 'Ligue cada animal à sua sombra!', 64),
  make('shadow-mat-2', 'maternal', 'facil', 'shadow-match', 'formas', 'Sombras dos Mobs', 'Quem é quem?', 'Ligue cada mob à sua sombra!', 65),
  make('shadow-pre1-1', 'pre-escola-1', 'medio', 'shadow-match', 'formas', 'Sombras Misteriosas', 'Olhe bem o formato!', 'Ligue cada mob à sua sombra!', 68),
  make('shadow-pre1-2', 'pre-escola-1', 'medio', 'shadow-match', 'formas', 'Sombras da Noite', 'Os monstros saíram!', 'Ligue os monstros às suas sombras!', 69),
  make('shadow-pre2-1', 'pre-escola-2', 'dificil', 'shadow-match', 'formas', 'Mestre das Sombras', 'Cinco mobs, cinco sombras!', 'Ligue cada mob à sua sombra!', 67),
  make('shadow-pre2-2', 'pre-escola-2', 'dificil', 'shadow-match', 'formas', 'Sombras do Campo', 'Os animais estão escondidos!', 'Ligue cada animal à sua sombra!', 68),

  // ---------- BUILD PATTERN (copiar construção 2x2, 3x3, 4x4) ----------
  make('build-ber-1', 'bercario', 'facil', 'build-pattern', 'coordenacao', 'Primeira Construção', 'Coloque os blocos iguais!', 'Copie a construção 2x2!', 61),
  make('build-mat-1', 'maternal', 'facil', 'build-pattern', 'coordenacao', 'Torrinha', 'Copie os blocos!', 'Copie a construção 2x2!', 66),
  make('build-mat-2', 'maternal', 'facil', 'build-pattern', 'coordenacao', 'Muro Colorido', 'Copie os blocos!', 'Copie o muro 2x2!', 67),
  make('build-pre1-1', 'pre-escola-1', 'medio', 'build-pattern', 'coordenacao', 'Casinha 3x3', 'Copie a casinha!', 'Copie a construção 3x3!', 70),
  make('build-pre1-2', 'pre-escola-1', 'medio', 'build-pattern', 'coordenacao', 'Torre 3x3', 'Copie a torre!', 'Copie a torre 3x3!', 71),
  make('build-pre2-1', 'pre-escola-2', 'dificil', 'build-pattern', 'coordenacao', 'Castelo 4x4', 'Uma construção grande!', 'Copie o castelo 4x4!', 69),
  make('build-pre2-2', 'pre-escola-2', 'dificil', 'build-pattern', 'coordenacao', 'Vila 4x4', 'Copie cada bloco!', 'Copie a construção 4x4!', 70),

  // ---------- MATH-MOBS (contas com mobs na tela; 8 tarefas cada) ----------
  // Fácil (Pré-Escola): + e − até 5 · Médio (1º e 2º ano): + e − até 10, × até 3x3
  // Difícil (3º ao 5º ano): todas, × até 5x5 (máx. 20 mobs), ÷ exata
  // Adição
  make('mm-add-1', 'pre-escola-1', 'facil', 'math-mobs', 'matematica', 'Soma dos Estourinhos', 'Os estourinhos se juntam: quantos ficaram?', 'Some os estourinhos: 2 estourinhos + 3 estourinhos = ?', 80),
  make('mm-add-2', 'pre-escola-1', 'facil', 'math-mobs', 'matematica', 'Porquinhos Juntos', 'Os porcos chegam dos dois lados!', '1 porco + 4 porcos = ?', 81),
  make('mm-add-3', 'fundamental-1', 'medio', 'math-mobs', 'matematica', 'Rebanho de Ovelhas', 'Junte os dois grupos de ovelhas!', '6 ovelhas + 4 ovelhas = ?', 80),
  make('mm-add-4', 'fundamental-2', 'dificil', 'math-mobs', 'matematica', 'Galinheiro Cheio', 'Muitas galinhas para somar!', '9 galinhas + 8 galinhas = ?', 81),
  // Subtração
  make('mm-sub-1', 'pre-escola-1', 'facil', 'math-mobs', 'matematica', 'Porcos que Saíram', 'Alguns porcos foram embora!', '5 porcos - 2 porcos = ?', 82),
  make('mm-sub-2', 'pre-escola-1', 'facil', 'math-mobs', 'matematica', 'Estourinho Sumiu!', 'Um estourinho virou fumaça!', '4 estourinhos - 1 estourinho = ?', 83),
  make('mm-sub-3', 'fundamental-1', 'medio', 'math-mobs', 'matematica', 'Ovelhas no Pasto', 'Quantas ovelhas sobraram?', '9 ovelhas - 4 ovelhas = ?', 82),
  make('mm-sub-4', 'fundamental-2', 'dificil', 'math-mobs', 'matematica', 'Diamantes Gastos', 'Quantos diamantes sobraram no baú?', '15 diamantes - 7 diamantes = ?', 83),
  // Multiplicação
  make('mm-mul-1', 'fundamental-1', 'medio', 'math-mobs', 'matematica', 'Fileiras de Porcos', 'Fileiras iguais de porcos!', '2 fileiras × 3 porcos = ?', 84),
  make('mm-mul-2', 'fundamental-1', 'medio', 'math-mobs', 'matematica', 'Galinhas em Fila', 'Conte as fileiras de galinhas!', '3 fileiras × 3 galinhas = ?', 85),
  make('mm-mul-3', 'fundamental-2', 'dificil', 'math-mobs', 'matematica', 'Grande Rebanho', 'Uma grade cheia de ovelhas!', '4 fileiras × 5 ovelhas = ?', 86),
  make('mm-mul-4', 'fundamental-2', 'dificil', 'math-mobs', 'matematica', 'Muro de Blocos', 'Fileiras de blocos de grama!', '3 fileiras × 5 blocos = ?', 87),
  // Divisão
  make('mm-div-1', 'fundamental-2', 'dificil', 'math-mobs', 'matematica', 'Cercados dos Porcos', 'Reparta os porcos igualmente!', '6 porcos ÷ 3 cercados = ?', 88),
  make('mm-div-2', 'fundamental-2', 'dificil', 'math-mobs', 'matematica', 'Ovelhas Divididas', 'Duas cercas, ovelhas iguais!', '8 ovelhas ÷ 2 cercados = ?', 89),
  make('mm-div-3', 'fundamental-2', 'dificil', 'math-mobs', 'matematica', 'Galinhas nos Cercados', 'Quantas galinhas em cada cercado?', '12 galinhas ÷ 4 cercados = ?', 90),
  make('mm-div-4', 'fundamental-2', 'dificil', 'math-mobs', 'matematica', 'Tesouro Repartido', 'Divida os diamantes igualmente!', '20 diamantes ÷ 5 cercados = ?', 91),
];

// ---------- versões para a aventura (usadas em adventureActivities.ts) ----------

type AdvAge = 'bercario' | 'maternal' | 'pre-escola-1' | 'pre-escola-2';
const AGE_DIFFICULTY: Record<AdvAge, Difficulty> = {
  bercario: 'facil',
  maternal: 'facil',
  'pre-escola-1': 'medio',
  'pre-escola-2': 'dificil',
};
const AGE_PREFIX: Record<AdvAge, string> = { bercario: 'ber', maternal: 'mat', 'pre-escola-1': 'pre1', 'pre-escola-2': 'pre2' };

interface AdventureExtra {
  level: number;
  type: ActivityType;
  category: ActivityCategory;
  title: string;
  questions: Partial<Record<AdvAge, string>>;
}

// Fases escolhidas pelo tema do mundo
const ADVENTURE_EXTRAS: AdventureExtra[] = [
  {
    level: 4, // Vila Inicial — Animais da Vila
    type: 'shadow-match',
    category: 'formas',
    title: 'Sombras da Vila',
    questions: {
      bercario: 'Toque no animal da vila e na sombra dele!',
      maternal: 'Ligue os animais da vila às suas sombras!',
      'pre-escola-1': 'Ligue cada mob da vila à sua sombra!',
      'pre-escola-2': 'Ligue cada mob da vila à sua sombra!',
    },
  },
  {
    level: 9, // Vila Inicial — Montando Blocos
    type: 'build-pattern',
    category: 'coordenacao',
    title: 'Construa na Vila',
    questions: {
      bercario: 'Copie a casinha da vila 2x2!',
      maternal: 'Copie a casinha da vila 2x2!',
      'pre-escola-1': 'Copie a casa da vila 3x3!',
      'pre-escola-2': 'Copie a casa da vila 4x4!',
    },
  },
  {
    level: 14, // Floresta
    type: 'crafting',
    category: 'desafios',
    title: 'Madeira da Floresta',
    questions: {
      maternal: 'Use a madeira da floresta: monte um graveto!',
      'pre-escola-1': 'Use a madeira da floresta: monte uma espada de madeira!',
      'pre-escola-2': 'Use a madeira da floresta: monte um machado de madeira!',
    },
  },
  {
    level: 23, // Mina dos Números
    type: 'mining-math',
    category: 'matematica',
    title: 'Minerando Números',
    questions: {
      maternal: 'Minere o resultado: 2 + 1',
      'pre-escola-1': 'Minere o resultado: 6 + 3',
      'pre-escola-2': 'Minere o resultado: 12 - 5',
    },
  },
  {
    level: 44, // Oceano
    type: 'word-builder',
    category: 'linguagem',
    title: 'Palavras do Mar',
    questions: {
      maternal: 'Monte com sílabas: PEI-XE',
      'pre-escola-1': 'Monte a palavra PEIXE!',
      'pre-escola-2': 'Quem vive no mar? Monte o nome! (PEIXE)',
    },
  },
];

/** Atividades extras da aventura de uma faixa etária. */
export function getAdventureExtraActivities(age: AdvAge): Activity[] {
  return ADVENTURE_EXTRAS.filter((e) => e.questions[age]).map((e) =>
    make(
      `adv-new-${AGE_PREFIX[age]}-${e.level}-${e.type}`,
      age,
      AGE_DIFFICULTY[age],
      e.type,
      e.category,
      e.title,
      `Desafio extra da fase ${e.level}!`,
      e.questions[age]!,
      100 + e.level
    )
  );
}
