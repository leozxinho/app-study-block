import type { MobType } from '../components/mobs/mobSprites';

// Palavras infantis com figura e sílabas (usadas em montar palavra, ordenar sílabas e primeira letra).
export interface WordEntry {
  word: string;
  syllables: string[];
  emoji?: string;
  mob?: MobType;
}

export const WORDS: WordEntry[] = [
  { word: 'CASA', syllables: ['CA', 'SA'], emoji: '🏠' },
  { word: 'BOLA', syllables: ['BO', 'LA'], emoji: '⚽' },
  { word: 'BOLO', syllables: ['BO', 'LO'], emoji: '🎂' },
  { word: 'GATO', syllables: ['GA', 'TO'], emoji: '🐱' },
  { word: 'PATO', syllables: ['PA', 'TO'], emoji: '🦆' },
  { word: 'VACA', syllables: ['VA', 'CA'], mob: 'cow' },
  { word: 'LOBO', syllables: ['LO', 'BO'], mob: 'wolf' },
  { word: 'PORCO', syllables: ['POR', 'CO'], mob: 'pig' },
  { word: 'OVELHA', syllables: ['O', 'VE', 'LHA'], mob: 'sheep' },
  { word: 'GALINHA', syllables: ['GA', 'LI', 'NHA'], mob: 'chicken' },
  { word: 'PEIXE', syllables: ['PEI', 'XE'], emoji: '🐟' },
  { word: 'SAPO', syllables: ['SA', 'PO'], emoji: '🐸' },
  { word: 'MAPA', syllables: ['MA', 'PA'], emoji: '🗺️' },
  { word: 'FOGO', syllables: ['FO', 'GO'], emoji: '🔥' },
  { word: 'LUA', syllables: ['LU', 'A'], emoji: '🌙' },
  { word: 'SOL', syllables: ['SOL'], emoji: '☀️' },
  { word: 'FLOR', syllables: ['FLOR'], emoji: '🌸' },
  { word: 'OVO', syllables: ['O', 'VO'], emoji: '🥚' },
  { word: 'NEVE', syllables: ['NE', 'VE'], emoji: '❄️' },
  { word: 'FOLHA', syllables: ['FO', 'LHA'], emoji: '🍃' },
  { word: 'MINA', syllables: ['MI', 'NA'], emoji: '⛏️' },
  { word: 'CAMELO', syllables: ['CA', 'ME', 'LO'], emoji: '🐫' },
  { word: 'BALEIA', syllables: ['BA', 'LEI', 'A'], emoji: '🐋' },
  { word: 'ESCUDO', syllables: ['ES', 'CU', 'DO'], emoji: '🛡️' },
  { word: 'CASTELO', syllables: ['CAS', 'TE', 'LO'], emoji: '🏰' },
  { word: 'ESCOLA', syllables: ['ES', 'CO', 'LA'], emoji: '🏫' },
  { word: 'JANELA', syllables: ['JA', 'NE', 'LA'], emoji: '🪟' },
  { word: 'BANANA', syllables: ['BA', 'NA', 'NA'], emoji: '🍌' },
  { word: 'MACACO', syllables: ['MA', 'CA', 'CO'], emoji: '🐒' },
  { word: 'TATU', syllables: ['TA', 'TU'], emoji: '🦔' },
  { word: 'ABELHA', syllables: ['A', 'BE', 'LHA'], emoji: '🐝' },
];

export function findWord(word: string): WordEntry | undefined {
  return WORDS.find((w) => w.word === word.toUpperCase());
}
