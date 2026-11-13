import type { ActivityCategory } from '../types';
import { WORLD_THEMES, type WorldTheme } from './worldThemes';

/** Fora da aventura, cada tema de atividade usa o cenário de um mundo. */
const BY_CATEGORY: Record<ActivityCategory, number> = {
  linguagem: 0, // vila
  cores: 1, // floresta
  matematica: 2, // mina
  formas: 3, // deserto
  natureza: 4, // oceano
  desafios: 6, // nether
  coordenacao: 7, // castelo
};

export function themeForCategory(category: ActivityCategory): WorldTheme {
  return WORLD_THEMES[BY_CATEGORY[category] ?? 0];
}
