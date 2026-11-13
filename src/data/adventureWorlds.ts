import { World, AdventureLevel } from '../types';

export const ADVENTURE_WORLDS: World[] = [
  {
    id: 'world-1',
    name: 'Vila Inicial',
    description: 'Comece sua aventura na vila! Aprenda o básico.',
    theme: 'village',
    icon: '🏠',
    bgColor: 'from-green-400 to-emerald-500',
    worldOrder: 1,
    levelRange: [1, 10],
  },
  {
    id: 'world-2',
    name: 'Floresta',
    description: 'Explore a floresta encantada e descubra novos desafios!',
    theme: 'forest',
    icon: '🌳',
    bgColor: 'from-green-600 to-green-800',
    worldOrder: 2,
    levelRange: [11, 20],
  },
  {
    id: 'world-3',
    name: 'Mina dos Números',
    description: 'Entre na mina e descubra os segredos da matemática!',
    theme: 'mine',
    icon: '⛏️',
    bgColor: 'from-yellow-500 to-amber-700',
    worldOrder: 3,
    levelRange: [21, 30],
  },
  {
    id: 'world-4',
    name: 'Deserto',
    description: 'Atravesse o deserto quente e resolva enigmas!',
    theme: 'desert',
    icon: '🏜️',
    bgColor: 'from-yellow-400 to-orange-500',
    worldOrder: 4,
    levelRange: [31, 40],
  },
  {
    id: 'world-5',
    name: 'Oceano',
    description: 'Mergulhe no oceano e descubra tesouros submarinos!',
    theme: 'ocean',
    icon: '🌊',
    bgColor: 'from-blue-400 to-cyan-600',
    worldOrder: 5,
    levelRange: [41, 50],
  },
  {
    id: 'world-6',
    name: 'Montanhas de Neve',
    description: 'Escale as montanhas geladas e enfrente o frio!',
    theme: 'snow',
    icon: '🏔️',
    bgColor: 'from-blue-100 to-blue-300',
    worldOrder: 6,
    levelRange: [51, 60],
  },
  {
    id: 'world-7',
    name: 'Reino do Nether',
    description: 'Entre no Nether e supere os desafios de fogo!',
    theme: 'nether',
    icon: '🔥',
    bgColor: 'from-red-500 to-orange-700',
    worldOrder: 7,
    levelRange: [61, 70],
  },
  {
    id: 'world-8',
    name: 'Castelo dos Desafios',
    description: 'O castelo guarda os desafios mais difíceis!',
    theme: 'castle',
    icon: '🏰',
    bgColor: 'from-purple-500 to-violet-700',
    worldOrder: 8,
    levelRange: [71, 80],
  },
  {
    id: 'world-9',
    name: 'Reino do End',
    description: 'Chegue ao End e enfrente os últimos mistérios!',
    theme: 'end',
    icon: '🐉',
    bgColor: 'from-indigo-800 to-purple-900',
    worldOrder: 9,
    levelRange: [81, 90],
  },
  {
    id: 'world-10',
    name: 'Grande Desafio',
    description: 'O desafio final! Mostre tudo que aprendeu!',
    theme: 'final',
    icon: '🏆',
    bgColor: 'from-yellow-400 to-yellow-600',
    worldOrder: 10,
    levelRange: [91, 100],
  },
];

// Level names for each world (10 per world)
const LEVEL_NAMES: string[][] = [
  // World 1 - Vila Inicial
  ['Primeiros Passos', 'Conhecendo Cores', 'Blocos Mágicos', 'Animais da Vila', 'Formas Básicas', 'Sons e Objetos', 'Contando Blocos', 'Cores do Arco-Íris', 'Montando Blocos', 'Festa na Vila'],
  // World 2 - Floresta
  ['Árvores da Floresta', 'Letras Escondidas', 'Contando Folhas', 'Formas na Natureza', 'Cores da Floresta', 'Sons da Floresta', 'Trilha das Letras', 'Animais na Floresta', 'Números Verdes', 'Coração da Floresta'],
  // World 3 - Mina dos Números
  ['Minério de Cobre', 'Contando Minérios', 'Somas na Mina', 'Subtrações no Escuro', 'Sequências de Pedra', 'Baú dos Números', 'Diamantes Escondidos', 'Picareta Mágica', 'Trilhos Numéricos', 'Tesouro da Mina'],
  // World 4 - Deserto
  ['Templo do Deserto', 'Cactos Coloridos', 'Letras na Areia', 'Formas Douradas', 'Contando Estrelas', 'Pirâmide Numérica', 'Oásis das Letras', 'Camelo Contador', 'Tempestade de Areia', 'Tesouro do Faraó'],
  // World 5 - Oceano
  ['Mergulho Inicial', 'Peixes Coloridos', 'Contando Conchas', 'Letras Submarinas', 'Formas do Mar', 'Bolhas Numéricas', 'Coral das Cores', 'Tartaruga Sábia', 'Navio Pirata', 'Tesouro Submarino'],
  // World 6 - Montanhas de Neve
  ['Primeira Neve', 'Flocos de Gelo', 'Iglu dos Números', 'Letras Geladas', 'Formas de Cristal', 'Esqui Colorido', 'Boneco de Neve', 'Urso Polar', 'Aurora Boreal', 'Topo da Montanha'],
  // World 7 - Reino do Nether
  ['Portal do Nether', 'Fogo e Cores', 'Lava Numérica', 'Blocos de Magma', 'Ghast das Letras', 'Fortaleza Secreta', 'Poção Mágica', 'Blaze de Fogo', 'Wither Skeleton', 'Trono do Nether'],
  // World 8 - Castelo dos Desafios
  ['Portão do Castelo', 'Sala de Quebra-Cabeças', 'Torre dos Números', 'Biblioteca Mágica', 'Labirinto de Formas', 'Salão das Cores', 'Masmorra Secreta', 'Dragão Guardião', 'Coroa de Diamante', 'Trono Real'],
  // World 9 - Reino do End
  ['Portal do End', 'Enderman das Letras', 'Ilha dos Números', 'Chorus Colorido', 'Formas do Vazio', 'Shulker Numérico', 'Barco do End', 'Cidade do End', 'Ovo do Dragão', 'Ender Dragon'],
  // World 10 - Grande Desafio
  ['Desafio das Cores', 'Desafio dos Números', 'Desafio das Letras', 'Desafio das Formas', 'Desafio dos Animais', 'Super Memória', 'Super Sequência', 'Super Contagem', 'Desafio Final', 'Grande Mestre!'],
];

// Activity mapping per age group
// Each age group now has 100 dedicated themed activities (one per level)
// Stored in adventureActivities.ts

import { getAdventureActivity, ADVENTURE_EXTRA_LEVELS } from './adventureActivities';

function getDifficultyForLevel(levelNumber: number): 'facil' | 'medio' | 'dificil' {
  if (levelNumber <= 30) return 'facil';
  if (levelNumber <= 70) return 'medio';
  return 'dificil';
}

function getXPRewardForLevel(levelNumber: number): number {
  if (levelNumber <= 10) return 10;
  if (levelNumber <= 20) return 15;
  if (levelNumber <= 30) return 20;
  if (levelNumber <= 50) return 25;
  if (levelNumber <= 70) return 30;
  if (levelNumber <= 90) return 35;
  return 50;
}

/**
 * Generate 100 adventure levels for a given age group
 * Each level maps to a unique themed activity from adventureActivities.ts
 */
export function generateAdventureLevels(ageGroup: string): AdventureLevel[] {
  const levels: AdventureLevel[] = [];

  for (let i = 0; i < 100; i++) {
    const levelNumber = i + 1;
    const worldIndex = Math.floor(i / 10);
    const levelInWorld = i % 10;
    const world = ADVENTURE_WORLDS[worldIndex];

    // Get the dedicated themed activity for this level and age group
    const activity = getAdventureActivity(levelNumber, ageGroup);
    const activityId = activity ? activity.id : `adv-${ageGroup.replace('pre-escola-', 'pre')}-${levelNumber}`;

    levels.push({
      id: `level-${levelNumber}`,
      worldId: world.id,
      levelNumber,
      name: LEVEL_NAMES[worldIndex][levelInWorld],
      description: `Fase ${levelNumber} - ${LEVEL_NAMES[worldIndex][levelInWorld]}`,
      // + desafios extras dos tipos novos (ver fim de adventureActivities.ts)
      activityIds: [activityId, ...(ADVENTURE_EXTRA_LEVELS[ageGroup]?.[levelNumber] ?? [])],
      difficulty: getDifficultyForLevel(levelNumber),
      xpReward: getXPRewardForLevel(levelNumber),
    });
  }

  return levels;
}

/**
 * Get the world a level belongs to
 */
export function getWorldForLevel(levelNumber: number): World {
  const worldIndex = Math.min(Math.floor((levelNumber - 1) / 10), 9);
  return ADVENTURE_WORLDS[worldIndex];
}

/**
 * Get all levels for a specific world
 */
export function getLevelsForWorld(worldId: string, ageGroup: string): AdventureLevel[] {
  const allLevels = generateAdventureLevels(ageGroup);
  return allLevels.filter(l => l.worldId === worldId);
}
