import { StudentLevelProgress, LevelStatus } from '../types';
import { ADVENTURE_WORLDS } from '../data/adventureWorlds';
import { progressService } from './progressService';
import { progressStore } from '../lib/store';

// Progresso da aventura da conta ativa, separado por faixa etária.
// Fica no store único (navegador ou Supabase, conforme a conta): ver src/lib/store.

const SLICE = 'adventure';
const SETTINGS = 'settings';

interface LevelProgressData {
  status: LevelStatus;
  stars: number;
  score: number;
  attempts: number;
  completed_at?: string;
}

interface AdventureProgress {
  levels: Record<number, LevelProgressData>;
}

type AdventureByAge = Record<string, AdventureProgress>;

interface Settings {
  /** Responsável liberou todos os mundos e fases (aventura e tela "Mundo"). */
  unlockAll?: boolean;
  /** Fases por dia para abrir o baú (escolhida pelo responsável). */
  dailyGoal?: number;
}

export const DEFAULT_DAILY_GOAL = 3;

function unlockAllOn(): boolean {
  return Boolean(progressStore.read<Settings>(SETTINGS, {}).unlockAll);
}

function getXPForLevel(levelNumber: number): number {
  if (levelNumber <= 10) return 10;
  if (levelNumber <= 20) return 15;
  if (levelNumber <= 30) return 20;
  if (levelNumber <= 50) return 25;
  if (levelNumber <= 70) return 30;
  if (levelNumber <= 90) return 35;
  return 50;
}

function calculateStars(score: number): number {
  if (score >= 100) return 3;
  if (score >= 70) return 2;
  if (score > 0) return 1;
  return 0;
}

/** Faixa etária escolhida agora (cada faixa tem seu próprio progresso na aventura). */
function currentAge(): string {
  try {
    return localStorage.getItem('minecraft_edu_age_group') || 'maternal';
  } catch {
    return 'maternal';
  }
}

function initialProgress(): AdventureProgress {
  const initial: AdventureProgress = { levels: {} };
  initial.levels[1] = { status: 'available', stars: 0, score: 0, attempts: 0 };
  for (let i = 2; i <= 100; i++) {
    initial.levels[i] = { status: 'locked', stars: 0, score: 0, attempts: 0 };
  }
  return initial;
}

function allAges(): AdventureByAge {
  const saved = progressStore.read<AdventureByAge>(SLICE, {});
  return saved && typeof saved === 'object' ? saved : {};
}

/** Cópia do progresso salvo da faixa (pode alterar e depois salvar). Valor corrompido conta como ausente. */
function getSaved(age: string = currentAge()): AdventureProgress {
  const saved = allAges()[age];
  return saved && saved.levels && typeof saved.levels === 'object'
    ? { levels: Object.fromEntries(Object.entries(saved.levels).map(([k, v]) => [k, { ...v }])) }
    : initialProgress();
}

/** Progresso para mostrar (só leitura): com "liberar tudo" ligado, nada aparece trancado. */
function getProgress(age: string = currentAge()): AdventureProgress {
  const progress = getSaved(age);
  // Liberado pelo responsável: nenhuma fase fica trancada (as concluídas continuam com as estrelas)
  if (unlockAllOn()) {
    for (let i = 1; i <= 100; i++) {
      const lvl = progress.levels[i];
      if (!lvl) progress.levels[i] = { status: 'available', stars: 0, score: 0, attempts: 0 };
      else if (lvl.status === 'locked') lvl.status = 'available';
    }
  }
  return progress;
}

function saveProgress(progress: AdventureProgress, age: string = currentAge()): void {
  progressStore.write(SLICE, { ...allAges(), [age]: progress });
}

function getWorldNameByOrder(worldOrder: number): string | null {
  const world = ADVENTURE_WORLDS.find(w => w.worldOrder === worldOrder);
  return world ? world.name : null;
}

export const adventureService = {
  getLevelProgress(ageGroup: string = currentAge()): Record<number, StudentLevelProgress> {
    const progress = getProgress(ageGroup);
    const result: Record<number, StudentLevelProgress> = {};
    const owner = progressStore.getAccountId();

    for (let i = 1; i <= 100; i++) {
      const levelData = progress.levels[i] || { status: 'locked', stars: 0, score: 0, attempts: 0 };
      result[i] = {
        id: `${owner}-${i}`,
        student_id: owner,
        level_number: i,
        status: levelData.status,
        stars: levelData.stars,
        score: levelData.score,
        attempts: levelData.attempts,
        completed_at: levelData.completed_at,
        updated_at: new Date().toISOString(),
      };
    }

    return result;
  },

  getLevelStatus(levelNumber: number, ageGroup: string = currentAge()): LevelStatus {
    return getProgress(ageGroup).levels[levelNumber]?.status || 'locked';
  },

  startLevel(levelNumber: number, ageGroup: string = currentAge()): void {
    const progress = getSaved(ageGroup);
    if (progress.levels[levelNumber]) {
      // Fase já concluída continua "concluída" ao jogar de novo
      if (progress.levels[levelNumber].status !== 'completed') progress.levels[levelNumber].status = 'in_progress';
      progress.levels[levelNumber].attempts += 1;
    } else {
      progress.levels[levelNumber] = { status: 'in_progress', stars: 0, score: 0, attempts: 1 };
    }
    saveProgress(progress, ageGroup);
  },

  completeLevel(
    levelNumber: number,
    score: number,
    ageGroup: string = currentAge()
  ): { stars: number; xpGained: number; worldCompleted: boolean; newWorldUnlocked: string | null } {
    const stars = calculateStars(score);
    const xpGained = getXPForLevel(levelNumber);
    const progress = getSaved(ageGroup);

    // Update completed level (mantém o melhor resultado se jogar de novo)
    const previous = progress.levels[levelNumber];
    progress.levels[levelNumber] = {
      status: 'completed',
      stars: Math.max(stars, previous?.stars ?? 0),
      score: Math.max(score, previous?.score ?? 0),
      attempts: (previous?.attempts || 0) + (previous?.status === 'in_progress' ? 0 : 1),
      completed_at: new Date().toISOString(),
    };

    // Unlock next level if within bounds
    if (levelNumber < 100 && progress.levels[levelNumber + 1]?.status === 'locked') {
      progress.levels[levelNumber + 1].status = 'available';
    }

    saveProgress(progress, ageGroup);
    progressService.addXP(xpGained);

    // Check world completion
    const worldOrder = Math.ceil(levelNumber / 10);
    const worldStartLevel = (worldOrder - 1) * 10 + 1;
    const worldEndLevel = worldOrder * 10;

    let worldCompleted = true;
    for (let i = worldStartLevel; i <= worldEndLevel; i++) {
      if (progress.levels[i]?.status !== 'completed') {
        worldCompleted = false;
        break;
      }
    }

    const newWorldUnlocked = worldCompleted && worldOrder < 10
      ? getWorldNameByOrder(worldOrder + 1)
      : null;

    return { stars, xpGained, worldCompleted, newWorldUnlocked };
  },

  getAdventureStats(ageGroup: string = currentAge()): { totalStars: number; completedLevels: number; currentLevel: number; totalXP: number } {
    const progress = getProgress(ageGroup);
    let totalStars = 0;
    let completedLevels = 0;
    let currentLevel = 1;
    let totalXP = 0;

    for (let i = 1; i <= 100; i++) {
      const level = progress.levels[i];
      if (level) {
        totalStars += level.stars;
        if (level.status === 'completed') {
          completedLevels++;
          totalXP += getXPForLevel(i);
        }
        if (level.status === 'available' || level.status === 'in_progress') {
          currentLevel = i;
        }
      }
    }

    // If no level is available/in_progress but some are completed, current is next after last completed
    if (currentLevel === 1 && completedLevels > 0) {
      currentLevel = Math.min(completedLevels + 1, 100);
    }

    return { totalStars, completedLevels, currentLevel, totalXP };
  },

  isWorldUnlocked(worldOrder: number, ageGroup: string = currentAge()): boolean {
    const levelData = getProgress(ageGroup).levels[(worldOrder - 1) * 10 + 1];
    if (!levelData) return false;
    return levelData.status === 'available' || levelData.status === 'in_progress' || levelData.status === 'completed';
  },

  /** Zera o progresso da aventura de uma faixa (ou de todas, com 'all'). */
  resetAdventureProgress(ageGroup: string = currentAge()): void {
    if (ageGroup === 'all') {
      progressStore.write(SLICE, {});
      return;
    }
    const rest = { ...allAges() };
    delete rest[ageGroup];
    progressStore.write(SLICE, rest);
  },

  /** Fases concluídas e fases com 3 estrelas, somando todas as faixas etárias. */
  countAllLevels(): { completed: number; perfect: number } {
    let completed = 0;
    let perfect = 0;
    for (const age of Object.values(allAges())) {
      for (const level of Object.values(age?.levels ?? {})) {
        if (level?.status === 'completed') {
          completed++;
          if (level.stars >= 3) perfect++;
        }
      }
    }
    return { completed, perfect };
  },

  /** Meta do dia (1 a 10 fases); padrão 3. */
  getDailyGoal(): number {
    const goal = progressStore.read<Settings>(SETTINGS, {}).dailyGoal;
    return typeof goal === 'number' && goal >= 1 && goal <= 10 ? Math.round(goal) : DEFAULT_DAILY_GOAL;
  },

  /** Todos os mundos e fases liberados pelo responsável. */
  areWorldsUnlocked(): boolean {
    return unlockAllOn();
  },
};
