import { Activity, ActivityCategory, ActivityType, AgeGroup, Difficulty } from '../types';

// Conteúdo novo (fora da aventura): relógio e leitura. A resposta fica entre [colchetes]
// e não aparece nem é lida (ver lib/activityParsers/extraContent.ts).
const now = new Date().toISOString();
const make = (id: string, age: AgeGroup, difficulty: Difficulty, type: ActivityType, category: ActivityCategory, title: string, question: string, order: number): Activity => ({
  id, title, description: title, age_group: age, category, difficulty, activity_type: type, question,
  image_url: '', points: 20, order_index: order, is_active: true, created_at: now, updated_at: now,
});

export const EXTRA_CONTENT: Activity[] = [
  make('clock-f1-1', 'fundamental-1', 'medio', 'clock', 'matematica', 'Que horas são?', 'Que horas são no relógio? [3:00]', 90),
  make('clock-f1-2', 'fundamental-1', 'medio', 'clock', 'matematica', 'Hora e meia', 'Que horas são no relógio? [7:30]', 91),
  make('clock-f2-1', 'fundamental-2', 'dificil', 'clock', 'matematica', 'Quarto de hora', 'Que horas são no relógio? [9:15]', 90),
  make('clock-f2-2', 'fundamental-2', 'dificil', 'clock', 'matematica', 'Quinze para', 'Que horas são no relógio? [4:45]', 91),
  make('read-pre2-1', 'pre-escola-2', 'medio', 'reading', 'linguagem', 'Leia a palavra', 'Leia a palavra e toque na figura certa! [BOLA]', 90),
  make('read-pre2-2', 'pre-escola-2', 'medio', 'reading', 'linguagem', 'Leia a palavra', 'Leia a palavra e toque na figura certa! [CASA]', 91),
  make('read-f1-1', 'fundamental-1', 'medio', 'reading', 'linguagem', 'Leitura rápida', 'Leia a palavra e toque na figura certa! [BOLO]', 92),
];
