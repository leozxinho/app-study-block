import { StudentProgress, StudentXP } from '../types';
import { XP_PER_ACTIVITY, XP_BONUS_FIRST_TRY, LEVELS } from '../lib/constants';
import { progressStore } from '../lib/store';

// XP, nível e atividades concluídas da conta ativa.
// Fica no store único (navegador ou Supabase, conforme a conta): ver src/lib/store.

const SLICE = 'progress';
/** Limite do histórico de atividades concluídas (evita documento gigante). */
const MAX_COMPLETED = 500;

interface LocalProgress {
  xp: number;
  level: number;
  completedActivities: StudentProgress[];
  achievements: string[];
  stars: number;
}

const EMPTY: LocalProgress = { xp: 0, level: 1, completedActivities: [], achievements: [], stars: 0 };

function getLocalProgress(): LocalProgress {
  const saved = progressStore.read<Partial<LocalProgress>>(SLICE, EMPTY);
  return {
    ...EMPTY,
    ...saved,
    completedActivities: Array.isArray(saved.completedActivities) ? saved.completedActivities : [],
  };
}

function saveLocalProgress(progress: LocalProgress) {
  progressStore.write(SLICE, progress);
}

export function levelForXP(xp: number): number {
  return LEVELS.findIndex((l) => xp < l.maxXP) + 1 || LEVELS.length;
}

function toXP(local: LocalProgress): StudentXP {
  return {
    id: progressStore.getAccountId(),
    student_id: progressStore.getAccountId(),
    total_xp: local.xp || 0,
    current_level: local.level || 1,
    updated_at: new Date().toISOString(),
  };
}

export const progressService = {
  /** Soma XP (síncrono na memória: duas conclusões seguidas não perdem pontos). */
  addXP(points: number): StudentXP {
    const local = getLocalProgress();
    local.xp = (local.xp || 0) + points;
    local.level = levelForXP(local.xp);
    saveLocalProgress(local);
    return toXP(local);
  },

  async completeActivity(activityId: string, score: number): Promise<void> {
    const xpGained = XP_PER_ACTIVITY + (score === 100 ? XP_BONUS_FIRST_TRY : 0);
    const local = getLocalProgress();
    local.completedActivities = local.completedActivities.slice(-(MAX_COMPLETED - 1));
    local.completedActivities.push({
      id: crypto.randomUUID(),
      student_id: progressStore.getAccountId(),
      activity_id: activityId,
      completed: true,
      score,
      attempts: 1,
      completed_at: new Date().toISOString(),
    });
    local.xp = (local.xp || 0) + xpGained;
    local.level = levelForXP(local.xp);
    local.stars = (local.stars || 0) + 1;
    saveLocalProgress(local);
  },

  getLocalStats() {
    return getLocalProgress();
  },

  /** Apaga só a lista de atividades concluídas (XP, nível e estrelas continuam). */
  resetCompletedActivities() {
    const local = getLocalProgress();
    local.completedActivities = [];
    saveLocalProgress(local);
  },
};
