/** Datas de jogo (AAAA-MM-DD no horário local): ofensiva e semana. Sem dependências. */

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/**
 * Dias seguidos jogando. Se ainda não jogou hoje, conta até ontem
 * (a sequência só quebra depois de um dia inteiro sem jogar).
 */
export function dailyStreak(playDays: string[], today = new Date()): number {
  const days = new Set(playDays);
  let cursor = days.has(dayKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Últimos 7 dias (mais antigo primeiro) com marcação de jogado. */
export function lastWeek(playDays: string[], today = new Date()) {
  const days = new Set(playDays);
  const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return { key: dayKey(d), label: names[d.getDay()], played: days.has(dayKey(d)), isToday: i === 6 };
  });
}
