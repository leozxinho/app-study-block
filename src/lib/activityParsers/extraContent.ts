import type { Activity } from '../../types';
import { pickRandom, randInt, sample, shuffle } from '../random';
import { WORDS } from '../words';
import type { ParseMeta } from './common';

// =============================================================
// Relógio ("Que horas são?") e Leitura ("Leia a palavra e toque na figura").
// A resposta fica entre colchetes na pergunta e NÃO aparece nem é lida:
//   "Que horas são no relógio? [3:30]"   "Leia a palavra e toque na figura certa! [GATO]"
// =============================================================

const BRACKET = /\s*\[([^\]]+)\]\s*/;

/** Pergunta sem a resposta entre colchetes (é o que aparece e o que a voz lê). */
export function hideAnswer(question: string): string {
  return question.replace(BRACKET, ' ').trim();
}

export const formatTime = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

export interface ClockData extends ParseMeta {
  hour: number; // 1..12
  minute: number; // 0, 15, 30, 45
  options: string[];
  displayQuestion: string;
}

export function parseClock(a: Pick<Activity, 'question' | 'age_group'>): ClockData {
  const m = a.question.match(/\[(\d{1,2}):(\d{2})\]/);
  const hour = m ? Math.min(12, Math.max(1, Number(m[1]))) : 3;
  const minute = m ? Number(m[2]) : 0;
  const answer = formatTime(hour, minute);
  const wrong = new Set<string>();
  const near = (h: number) => ((h + 11) % 12) + 1;
  const candidates = shuffle([
    formatTime(near(hour + 1), minute),
    formatTime(near(hour - 1), minute),
    formatTime(hour, (minute + 30) % 60),
    formatTime(minute === 0 ? 12 : Math.min(12, Math.max(1, Math.round(minute / 5))), (hour * 5) % 60), // ponteiros trocados
    formatTime(near(hour + 2), minute),
  ]);
  for (const c of candidates) if (c !== answer && wrong.size < 3) wrong.add(c);
  return {
    recognized: Boolean(m) && [0, 15, 30, 45].includes(minute),
    note: m ? undefined : 'horário [h:mm] não encontrado',
    hour,
    minute,
    options: shuffle([answer, ...wrong]),
    displayQuestion: hideAnswer(a.question),
  };
}

/** Nova hora para as rodadas (fundamental 1: horas cheias e meias; fundamental 2: também quartos). */
export function clockVariant(a: Pick<Activity, 'age_group'>): string {
  const minutes = a.age_group === 'fundamental-2' ? [0, 15, 30, 45] : [0, 30];
  return `Que horas são no relógio? [${formatTime(randInt(1, 12), pickRandom(minutes))}]`;
}

export interface ReadingData extends ParseMeta {
  word: string;
  options: { word: string; emoji: string }[];
  displayQuestion: string;
}

const PICTURE_WORDS = WORDS.filter((w) => w.emoji);

export function parseReading(a: Pick<Activity, 'question'>): ReadingData {
  const m = a.question.match(/\[([A-ZÁÉÍÓÚÂÊÔÃÕÇ]+)\]/);
  const entry = PICTURE_WORDS.find((w) => w.word === m?.[1]);
  const target = entry ?? PICTURE_WORDS[0];
  // distratores com outra figura (e de preferência começando com a mesma letra, para ler de verdade)
  const others = PICTURE_WORDS.filter((w) => w.word !== target.word && w.emoji !== target.emoji);
  const sameStart = others.filter((w) => w.word[0] === target.word[0]);
  const picked = [...sample(sameStart, Math.min(1, sameStart.length)), ...sample(others, 3)]
    .filter((w, i, all) => all.findIndex((x) => x.word === w.word) === i)
    .slice(0, 3);
  return {
    recognized: Boolean(entry),
    note: entry ? undefined : 'palavra [MAIÚSCULA] com figura não encontrada',
    word: target.word,
    options: shuffle([target, ...picked]).map((w) => ({ word: w.word, emoji: w.emoji as string })),
    displayQuestion: hideAnswer(a.question),
  };
}

export function readingVariant(a: Pick<Activity, 'question'>): string {
  const current = parseReading(a).word;
  const pool = PICTURE_WORDS.filter((w) => w.word !== current && w.word.length <= 6);
  return `Leia a palavra e toque na figura certa! [${pickRandom(pool).word}]`;
}
