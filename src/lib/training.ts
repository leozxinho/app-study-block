/** Treino (sem React): as atividades que a criança mais errou nos últimos 7 dias. */
export interface TrainingItem {
  activityId: string;
  title: string;
  type: string;
  errors: number;
  times: number;
}

export function trainingList(
  results: { activityId: string; title?: string; type: string; errors: number; at: string }[],
  today = new Date(),
  max = 6
): TrainingItem[] {
  const since = today.getTime() - 7 * 86400000;
  const byId = new Map<string, TrainingItem>();
  for (const r of results) {
    const t = new Date(r.at).getTime();
    if (!r.activityId || Number.isNaN(t) || t < since || r.errors <= 0) continue;
    const item = byId.get(r.activityId) ?? { activityId: r.activityId, title: r.title ?? r.activityId, type: r.type, errors: 0, times: 0 };
    item.errors += r.errors;
    item.times += 1;
    if (r.title) item.title = r.title;
    byId.set(r.activityId, item);
  }
  return [...byId.values()].sort((a, b) => b.errors - a.errors || b.times - a.times).slice(0, max);
}
