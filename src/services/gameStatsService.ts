import { useSyncExternalStore } from 'react';
import { Activity, ActivityType, ActivityCategory, AgeGroup } from '../types';
import { DEFAULT_SKIN, SKIN_ITEMS, type PlayerSkin, type SkinSlot } from '../components/mobs/mobSprites';
import { starsForErrors } from '../lib/scoring';
import { progressService } from './progressService';
import { adventureService } from './adventureService';
import { progressStore } from '../lib/store';
import { dayKey, dailyStreak, lastWeek } from '../lib/days';
import { adaptiveLevel, type Adaptive } from '../lib/adaptive';

// Estatísticas do jogo da conta ativa: resultados por atividade, dias jogados,
// sequência de acertos, conquistas e loja de skins. Ficam no store único (ver src/lib/store).

const MAX_RESULTS = 500;

export interface ActivityResult {
  activityId: string;
  title: string;
  type: ActivityType;
  category: ActivityCategory;
  ageGroup: AgeGroup;
  errors: number;
  stars: number;
  at: string; // ISO
}

interface GameStats {
  results: ActivityResult[];
  /** Atividades seguidas acertadas sem nenhum erro */
  correctStreak: number;
  bestCorrectStreak: number;
  /** Dias em que jogou (AAAA-MM-DD, horário local) */
  playDays: string[];
  /** id da conquista → data em que desbloqueou */
  unlocked: Record<string, string>;
  spentXP: number;
  owned: string[]; // "slot:id"
  skin: PlayerSkin;
  /** Meta do dia: fases concluídas hoje e se o baú já foi aberto */
  daily: { day: string; levels: number; chest: boolean };
  /** Casinha: um bloco (id) ou '' por célula */
  house: string[];
  /** Recorde do Desafio Relâmpago */
  bestLightning: number;
  /** Tempo jogado hoje (segundos) e minutos extras liberados pelo adulto hoje */
  playTime: { day: string; seconds: number; extraMin: number };
}

const EMPTY: GameStats = {
  results: [],
  correctStreak: 0,
  bestCorrectStreak: 0,
  playDays: [],
  unlocked: {},
  spentXP: 0,
  owned: [],
  skin: DEFAULT_SKIN,
  daily: { day: '', levels: 0, chest: false },
  house: [],
  bestLightning: 0,
  playTime: { day: '', seconds: 0, extraMin: 0 },
};

/** XP extra do baú da meta do dia. */
export const CHEST_XP = 20;

// ---------- armazenamento (store único da conta ativa) + inscrição ----------

const SLICE = 'game';

/** Completa campos que faltam (dados antigos ou corrompidos). */
function normalize(saved: Partial<GameStats> | null | undefined): GameStats {
  if (!saved || typeof saved !== 'object') return { ...EMPTY };
  return {
    ...EMPTY,
    ...saved,
    results: Array.isArray(saved.results) ? saved.results : [],
    playDays: Array.isArray(saved.playDays) ? saved.playDays : [],
    owned: Array.isArray(saved.owned) ? saved.owned : [],
    house: Array.isArray(saved.house) ? saved.house : [],
    daily: saved.daily && typeof saved.daily === 'object' ? { ...EMPTY.daily, ...saved.daily } : { ...EMPTY.daily },
    playTime: saved.playTime && typeof saved.playTime === 'object' ? { ...EMPTY.playTime, ...saved.playTime } : { ...EMPTY.playTime },
    unlocked: saved.unlocked && typeof saved.unlocked === 'object' ? saved.unlocked : {},
    // Skins salvas antes de existir o traje de herói ganham os campos novos
    skin: { ...DEFAULT_SKIN, ...(saved.skin ?? {}) },
  };
}

// Mesmo objeto enquanto o store não muda (useSyncExternalStore exige referência estável)
let cachedVersion = -1;
let cached: GameStats = { ...EMPTY };

function current(): GameStats {
  const version = progressStore.getVersion();
  if (version !== cachedVersion) {
    cachedVersion = version;
    cached = normalize(progressStore.read<Partial<GameStats> | null>(SLICE, null));
  }
  return cached;
}

function save(next: GameStats): void {
  progressStore.write(SLICE, next);
}

function subscribe(l: () => void): () => void {
  return progressStore.subscribe(l);
}

/** Estado atual, atualizado quando muda. */
export function useGameStats(): GameStats {
  return useSyncExternalStore(subscribe, current, current);
}

// ---------- datas ----------

/** Dias seguidos jogando (ver lib/days). */
export function getDailyStreak(stats: GameStats = current(), today = new Date()): number {
  return dailyStreak(stats.playDays, today);
}

/** Últimos 7 dias (mais antigo primeiro) com marcação de jogado. */
export function getLastWeek(stats: GameStats = current(), today = new Date()) {
  return lastWeek(stats.playDays, today);
}

/** Dificuldade das próximas rodadas pelos últimos resultados (ver lib/adaptive). */
export function getAdaptiveLevel(stats: GameStats = current()): Adaptive {
  return adaptiveLevel(stats.results);
}

/** Meta do dia de hoje (zera sozinha quando o dia muda). */
export function getDailyProgress(stats: GameStats = current(), today = new Date()) {
  const goal = adventureService.getDailyGoal();
  const d = stats.daily.day === dayKey(today) ? stats.daily : { day: dayKey(today), levels: 0, chest: false };
  return { goal, done: Math.min(d.levels, goal), levels: d.levels, chest: d.chest, playedToday: stats.playDays.includes(dayKey(today)) };
}

// ---------- conquistas ----------

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'primeiro-bloco', name: 'Primeiro Bloco', description: 'Complete sua primeira atividade', icon: '🧱' },
  { id: 'coletor-estrelas', name: 'Coletor de Estrelas', description: 'Ganhe 5 estrelas', icon: '⭐' },
  { id: 'explorador', name: 'Explorador', description: 'Jogue atividades de 3 temas diferentes', icon: '🗺️' },
  { id: 'mestre-construtor', name: 'Mestre Construtor', description: 'Alcance o nível 3', icon: '🏗️' },
  // Novas
  { id: 'primeiro-crafting', name: 'Primeiro Crafting', description: 'Monte sua primeira receita na mesa de trabalho', icon: '🛠️' },
  { id: 'dez-seguidos', name: '10 Acertos Seguidos', description: 'Acerte 10 atividades seguidas sem errar', icon: '🔥' },
  { id: 'mundo-completo', name: 'Mundo Completo', description: 'Complete todas as fases de um mundo da aventura', icon: '🌍' },
  { id: 'tres-dias', name: '3 Dias Seguidos', description: 'Jogue 3 dias seguidos', icon: '📅' },
  // Troféus da aventura (bronze → prata → ouro → diamante → lenda)
  { id: 'trofeu-fases-5', name: 'Troféu de Bronze', description: 'Conclua 5 fases da aventura', icon: '🥉' },
  { id: 'trofeu-fases-10', name: 'Troféu de Prata', description: 'Conclua 10 fases da aventura', icon: '🥈' },
  { id: 'trofeu-fases-25', name: 'Troféu de Ouro', description: 'Conclua 25 fases da aventura', icon: '🥇' },
  { id: 'trofeu-fases-50', name: 'Troféu de Diamante', description: 'Conclua 50 fases da aventura', icon: '💎' },
  { id: 'trofeu-fases-100', name: 'Lenda da Aventura', description: 'Conclua 100 fases da aventura', icon: '👑' },
  { id: 'perfeito-3', name: 'Mira Certeira', description: 'Ganhe 3 estrelas em 3 fases', icon: '🎯' },
  { id: 'perfeito-10', name: 'Estrela Brilhante', description: 'Ganhe 3 estrelas em 10 fases', icon: '🌟' },
];

function checkAchievements(s: GameStats): string[] {
  const local = progressService.getLocalStats();
  const totalStars = s.results.reduce((sum, r) => sum + r.stars, 0);
  const adventure = adventureService.countAllLevels();
  const rules: Record<string, boolean> = {
    'primeiro-bloco': s.results.length >= 1,
    'coletor-estrelas': totalStars >= 5,
    explorador: new Set(s.results.map((r) => r.category)).size >= 3,
    'mestre-construtor': (local.level || 1) >= 3,
    'primeiro-crafting': s.results.some((r) => r.type === 'crafting'),
    'dez-seguidos': s.bestCorrectStreak >= 10,
    'mundo-completo': Boolean(s.unlocked['mundo-completo']),
    'tres-dias': getDailyStreak(s) >= 3,
    'trofeu-fases-5': adventure.completed >= 5,
    'trofeu-fases-10': adventure.completed >= 10,
    'trofeu-fases-25': adventure.completed >= 25,
    'trofeu-fases-50': adventure.completed >= 50,
    'trofeu-fases-100': adventure.completed >= 100,
    'perfeito-3': adventure.perfect >= 3,
    'perfeito-10': adventure.perfect >= 10,
  };
  return Object.keys(rules).filter((id) => rules[id] && !s.unlocked[id]);
}

function unlock(s: GameStats, ids: string[]): GameStats {
  if (ids.length === 0) return s;
  const now = new Date().toISOString();
  return { ...s, unlocked: { ...s.unlocked, ...Object.fromEntries(ids.map((id) => [id, now])) } };
}

// ---------- ações ----------

export const gameStatsService = {
  /** Registra uma atividade concluída. Retorna as conquistas desbloqueadas agora. */
  recordResult(activity: Activity, errors: number): AchievementDef[] {
    const state = current();
    const result: ActivityResult = {
      activityId: activity.id,
      title: activity.title,
      type: activity.activity_type,
      category: activity.category,
      ageGroup: activity.age_group,
      errors,
      stars: starsForErrors(errors),
      at: new Date().toISOString(),
    };
    const today = dayKey(new Date());
    const correctStreak = errors === 0 ? state.correctStreak + 1 : 0;
    let next: GameStats = {
      ...state,
      results: [...state.results, result].slice(-MAX_RESULTS),
      correctStreak,
      bestCorrectStreak: Math.max(state.bestCorrectStreak, correctStreak),
      playDays: state.playDays.includes(today) ? state.playDays : [...state.playDays, today],
    };
    const ids = checkAchievements(next);
    next = unlock(next, ids);
    save(next);
    return ACHIEVEMENTS.filter((a) => ids.includes(a.id));
  },

  /** Confere as conquistas de novo (ex.: depois de somar XP). Retorna as desbloqueadas agora. */
  checkNewAchievements(): AchievementDef[] {
    const state = current();
    const ids = checkAchievements(state);
    if (ids.length === 0) return [];
    save(unlock(state, ids));
    return ACHIEVEMENTS.filter((a) => ids.includes(a.id));
  },

  /** Errou uma resposta: zera a sequência de acertos. */
  recordWrong(): void {
    const state = current();
    if (state.correctStreak !== 0) save({ ...state, correctStreak: 0 });
  },

  /** Completou um mundo da aventura. */
  recordWorldCompleted(): AchievementDef[] {
    const state = current();
    if (state.unlocked['mundo-completo']) return [];
    save(unlock(state, ['mundo-completo']));
    return ACHIEVEMENTS.filter((a) => a.id === 'mundo-completo');
  },

  /**
   * Fase da aventura concluída: conta para a meta do dia.
   * Ao bater a meta pela 1ª vez no dia, abre o baú (+CHEST_XP de XP). Retorna o estado da meta.
   */
  recordLevelDone(): { goal: number; done: number; chestNow: boolean } {
    const state = current();
    const today = dayKey(new Date());
    const before = state.daily.day === today ? state.daily : { day: today, levels: 0, chest: false };
    const goal = adventureService.getDailyGoal();
    const levels = before.levels + 1;
    const chestNow = !before.chest && levels >= goal;
    save({ ...state, daily: { day: today, levels, chest: before.chest || chestNow } });
    if (chestNow) progressService.addXP(CHEST_XP);
    return { goal, done: Math.min(levels, goal), chestNow };
  },

  /** Soma tempo de jogo de hoje (zera quando o dia muda). */
  addPlayTime(seconds: number): void {
    const state = current();
    const today = dayKey(new Date());
    const pt = state.playTime.day === today ? state.playTime : { day: today, seconds: 0, extraMin: 0 };
    save({ ...state, playTime: { ...pt, seconds: pt.seconds + seconds } });
  },

  /** O adulto liberou mais minutos hoje. */
  addExtraMinutes(minutes: number): void {
    const state = current();
    const today = dayKey(new Date());
    const pt = state.playTime.day === today ? state.playTime : { day: today, seconds: 0, extraMin: 0 };
    save({ ...state, playTime: { ...pt, extraMin: pt.extraMin + minutes } });
  },

  /** Salva a casinha (lista de blocos por célula). */
  saveHouse(house: string[]): void {
    save({ ...current(), house });
  },

  /** Registra pontos do Desafio Relâmpago; true se for recorde. */
  recordLightning(score: number): boolean {
    const state = current();
    if (score <= state.bestLightning) return false;
    save({ ...state, bestLightning: score });
    return true;
  },

  isUnlocked(id: string, s: GameStats = current()): boolean {
    return Boolean(s.unlocked[id]);
  },

  // ---------- loja ----------

  /** XP disponível para gastar (o XP total e o nível não diminuem). */
  getXPBalance(s: GameStats = current()): number {
    return Math.max(0, (progressService.getLocalStats().xp || 0) - s.spentXP);
  },

  owns(slot: SkinSlot, id: string, s: GameStats = current()): boolean {
    const item = SKIN_ITEMS.find((i) => i.slot === slot && i.id === id);
    return item?.price === 0 || s.owned.includes(`${slot}:${id}`);
  },

  /** Compra (se tiver XP) e já veste. */
  buy(slot: SkinSlot, id: string): boolean {
    const item = SKIN_ITEMS.find((i) => i.slot === slot && i.id === id);
    if (!item) return false;
    if (this.owns(slot, id)) {
      this.equip(slot, id);
      return true;
    }
    if (this.getXPBalance() < item.price) return false;
    const state = current();
    save({
      ...state,
      spentXP: state.spentXP + item.price,
      owned: [...state.owned, `${slot}:${id}`],
      skin: { ...state.skin, [slot]: id },
    });
    return true;
  },

  equip(slot: SkinSlot, id: string): void {
    const state = current();
    if (!this.owns(slot, id)) return;
    save({ ...state, skin: { ...state.skin, [slot]: id } });
  },

  setCharacter(character: PlayerSkin['character']): void {
    const state = current();
    save({ ...state, skin: { ...state.skin, character } });
  },
};
