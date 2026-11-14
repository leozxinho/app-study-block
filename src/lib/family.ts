/**
 * Regras das contas de família (responsável → crianças), sem dependências:
 * validação do cadastro da criança e resumo do progresso a partir do documento dela.
 * As mesmas regras valem na Edge Function create-child e no SQL (supabase/).
 */
import type { AccountDoc } from './store/progressStore';
import { addDays, dailyStreak, dayKey } from './days';
import { PRODUCT } from '../config/product';

export const AGE_GROUP_IDS = ['bercario', 'maternal', 'pre-escola-1', 'pre-escola-2', 'fundamental-1', 'fundamental-2'] as const;
export const USERNAME_RULE = /^[a-z0-9._-]{3,20}$/;
/** Mesmo valor de PRODUCT.maxChildren e da Edge Function create-child. */
export const MAX_CHILDREN = PRODUCT.maxChildren;
/** Palavra que o responsável digita para confirmar o "zerar". */
export const RESET_WORD = 'ZERAR';

export interface ChildInput {
  name: string;
  username: string;
  password: string;
  ageGroup: string;
}

/** Login sempre minúsculo e sem espaços nas pontas. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Devolve a mensagem do primeiro problema, ou null se está tudo certo. */
export function validateChildInput(input: ChildInput): string | null {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 40) return 'Escreva o nome da criança (até 40 letras).';
  if (!USERNAME_RULE.test(normalizeUsername(input.username)))
    return 'Login: de 3 a 20 letras minúsculas ou números (pode usar ponto, traço ou _), sem espaço.';
  if (input.password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (input.password.length > 72) return 'A senha pode ter no máximo 72 caracteres.';
  if (!(AGE_GROUP_IDS as readonly string[]).includes(input.ageGroup)) return 'Escolha a faixa etária.';
  return null;
}

/** "Zerar" só libera com pelo menos uma criança marcada e a palavra digitada certinha. */
export function canConfirmReset(selectedCount: number, typed: string): boolean {
  return selectedCount > 0 && typed.trim().toUpperCase() === RESET_WORD;
}

export interface ChildResult {
  type: string;
  errors: number;
  stars: number;
  at: string;
  title?: string;
}

export interface ChildSummary {
  xp: number;
  level: number;
  completedLevels: number;
  levelStars: number;
  activitiesDone: number;
  streak: number;
  lastPlayed: string | null;
  playDays: string[];
  results: ChildResult[];
  achievements: number;
  unlockAll: boolean;
  dailyGoal: number;
  /** Tempo de tela por dia em minutos (0 = sem limite) */
  screenTimeMin: number;
  /** Roupa do personagem da criança (campos da loja; vazio = padrão) */
  skin: Record<string, string>;
}

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asObject = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const asNumber = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** Resumo para a Área dos Pais. Documento ausente ou estranho vira tudo zero. */
export function summarizeDoc(doc: AccountDoc | null | undefined, today = new Date()): ChildSummary {
  const slices = asObject(doc?.slices);
  const progress = asObject(slices.progress);
  const game = asObject(slices.game);
  const adventure = asObject(slices.adventure);
  const settings = asObject(slices.settings);

  let completedLevels = 0;
  let levelStars = 0;
  for (const age of Object.values(adventure)) {
    for (const level of Object.values(asObject(asObject(age).levels))) {
      const l = asObject(level);
      if (l.status === 'completed') completedLevels++;
      levelStars += asNumber(l.stars);
    }
  }

  const playDays = asArray<string>(game.playDays).filter((d) => typeof d === 'string').sort();
  return {
    xp: asNumber(progress.xp),
    level: asNumber(progress.level, 1),
    completedLevels,
    levelStars,
    activitiesDone: asArray(progress.completedActivities).length,
    streak: dailyStreak(playDays, today),
    lastPlayed: playDays.length ? playDays[playDays.length - 1] : null,
    playDays,
    results: asArray<ChildResult>(game.results),
    achievements: Object.keys(asObject(game.unlocked)).length,
    unlockAll: Boolean(settings.unlockAll),
    dailyGoal: asNumber(settings.dailyGoal, 3),
    screenTimeMin: asNumber(settings.screenTimeMin, 0),
    skin: Object.fromEntries(Object.entries(asObject(game.skin)).filter(([, v]) => typeof v === 'string')) as Record<string, string>,
  };
}

// ---------- relatório da semana (Área dos Pais) ----------

/** Atividades feitas em cada um dos últimos 7 dias (mais antigo primeiro). */
export function weekActivity(results: ChildResult[], today = new Date()) {
  const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const counts = new Map<string, number>();
  for (const r of results) {
    const d = new Date(r.at);
    if (!Number.isNaN(d.getTime())) counts.set(dayKey(d), (counts.get(dayKey(d)) ?? 0) + 1);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return { key: dayKey(d), label: names[d.getDay()], count: counts.get(dayKey(d)) ?? 0, isToday: i === 6 };
  });
}

/**
 * Ponto forte e onde precisa de ajuda: média de estrelas por tipo de atividade
 * (só tipos com pelo menos 2 resultados). null quando ainda não dá para dizer.
 */
export function strengths(results: ChildResult[]): { best: string; worst: string } | null {
  const byType = new Map<string, number[]>();
  for (const r of results) byType.set(r.type, [...(byType.get(r.type) ?? []), r.stars || 0]);
  const avg = [...byType.entries()]
    .filter(([, s]) => s.length >= 2)
    .map(([type, s]) => ({ type, avg: s.reduce((a, b) => a + b, 0) / s.length }))
    .sort((a, b) => b.avg - a.avg);
  if (avg.length < 2 || avg[0].avg === avg[avg.length - 1].avg) return null;
  return { best: avg[0].type, worst: avg[avg.length - 1].type };
}
