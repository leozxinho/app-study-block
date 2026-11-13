import { rand } from '../random';
import type { Activity } from '../../types';

/**
 * Todo parser diz se entendeu a pergunta.
 * recognized = false → o componente usa um conteúdo padrão (e a auditoria acusa).
 */
export interface ParseMeta {
  recognized: boolean;
  /** Por que não entendeu (para a auditoria) */
  note?: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** Alternativas numéricas perto da resposta: sem negativos, sem repetir. */
export function numericOptions(answer: number, count = 4, min = 0): number[] {
  const set = new Set<number>([answer]);
  const near = [1, -1, 2, -2, 3, -3, 4, 5]
    .map((d) => answer + d)
    .filter((n) => n >= min)
    .sort(() => rand() - 0.5);
  for (const n of near) {
    if (set.size >= count) break;
    set.add(n);
  }
  let extra = answer + 6;
  while (set.size < count) set.add(extra++);
  return [...set];
}

/** Faixa de quantidade usada quando a pergunta não diz (mesma de antes, por idade). */
export function ageCountRange(a: Pick<Activity, 'id' | 'age_group' | 'difficulty'>): [number, number] {
  if (a.id === 'mat-1') return [3, 3];
  if (a.id === 'pre1-1') return [5, 5];
  if (a.age_group === 'bercario') return [1, 2];
  if (a.age_group === 'maternal') return [2, 5];
  if (a.age_group === 'pre-escola-1') return [3, 8];
  if (a.age_group === 'fundamental-1') return [8, 15];
  if (a.age_group === 'fundamental-2') return [10, 20];
  return a.difficulty === 'dificil' ? [8, 15] : [5, 11];
}
