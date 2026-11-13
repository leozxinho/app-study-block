/**
 * Rodadas com variações fixas (para todas terem voz gravada).
 *   npx tsx --test scripts/tests/rounds.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADVENTURE_ACTIVITIES } from '../../src/data/adventureActivities';
import { MOCK_ACTIVITIES } from '../../src/data/mockActivities';
import { NEW_TYPE_ACTIVITIES } from '../../src/data/newTypeActivities';
import { buildRounds, hideAnswer, parseWordBuilder, roundCount, variantPool } from '../../src/lib/activityParsers';
import { stripNumberHints } from '../../src/lib/text';
import { speechText } from '../../src/lib/voice';
import type { Activity } from '../../src/types';

const all = [...Object.values(ADVENTURE_ACTIVITIES).flat(), ...MOCK_ACTIVITIES, ...NEW_TYPE_ACTIVITIES];

test('variações fixas: a mesma atividade gera sempre a mesma lista', () => {
  for (const a of all.slice(0, 200)) assert.deepEqual(variantPool(a), variantPool(a), a.id);
});

test('rodadas extras só usam textos da lista fixa (ou repetem a original)', () => {
  for (const a of all) {
    const allowed = new Set([a.question, ...variantPool(a)]);
    const rounds = buildRounds(a);
    assert.equal(rounds.length, roundCount(a), a.id);
    for (const r of rounds) assert.ok(allowed.has(r.question), `${a.id}: "${r.question}" fora da lista`);
  }
});

/** Lê a coluna de um CSV ";" com aspas. */
function column(path: string, name: string): string[] {
  const [header, ...rows] = readFileSync(path, 'utf8').replace(/^\uFEFF/, '').trim().split('\n');
  const cols = header.split(';').map((h) => h.replace(/"/g, ''));
  const i = cols.indexOf(name);
  return rows.map((r) => (r.match(/("(?:[^"]|"")*"|[^;]*)(;|$)/g) ?? [])[i]?.replace(/;$/, '').replace(/^"|"$/g, '').replace(/""/g, '"') ?? '');
}

test('todo texto que a voz lê está no CSV de perguntas ou no de rodadas', () => {
  const known = new Set([...column('docs/audio/falas-perguntas.csv', 'texto_falado'), ...column('docs/audio/falas-rodadas.csv', 'texto_original')]);
  const shown = (a: Activity) =>
    a.activity_type === 'math-mobs' ? null
    : a.activity_type === 'counting' ? stripNumberHints(a.question)
    : a.activity_type === 'word-builder' ? parseWordBuilder(a).displayQuestion
    : a.activity_type === 'clock' || a.activity_type === 'reading' ? hideAnswer(a.question)
    : a.question;
  const missing: string[] = [];
  for (const a of all) {
    for (const q of [a.question, ...variantPool(a)]) {
      const t = shown({ ...a, question: q });
      if (!t) continue;
      if (!known.has(speechText(t)) && !known.has(speechText(stripNumberHints(t)))) missing.push(`${a.id}: ${t}`);
    }
  }
  assert.deepEqual(missing.slice(0, 5), [], `${missing.length} textos sem linha no CSV (rode npx tsx scripts/exportVoiceLines.ts)`);
});

import { adaptiveLevel, pickByLevel, questionWeight } from '../../src/lib/adaptive';

test('dificuldade adaptativa: decide pelos últimos resultados', () => {
  const r = (stars: number) => ({ stars });
  assert.equal(adaptiveLevel([r(3), r(3)]), 'normal', 'poucos resultados');
  assert.equal(adaptiveLevel([r(3), r(3), r(3), r(3), r(3), r(2)]), 'harder');
  assert.equal(adaptiveLevel([r(1), r(1), r(2), r(1), r(1)]), 'easier');
  assert.equal(adaptiveLevel([r(2), r(2), r(3), r(2), r(1)]), 'normal');
});

test('dificuldade adaptativa: escolhe só da lista, as mais fáceis ou as mais difíceis', () => {
  const pool = ['Quanto é 1 + 1?', 'Quanto é 2 + 3?', 'Quanto é 9 + 8?', 'Quanto é 7 + 9?', 'Quanto é 1 + 2?', 'Quanto é 8 + 6?'];
  const id = <T,>(a: T[]) => a;
  const hard = pickByLevel(pool, 3, 'harder', id);
  const easy = pickByLevel(pool, 3, 'easier', id);
  assert.ok(hard.every((q) => pool.includes(q)) && easy.every((q) => pool.includes(q)));
  assert.ok(Math.min(...hard.map(questionWeight)) > Math.max(...easy.map(questionWeight)), 'difíceis pesam mais que as fáceis');
  for (const a of all.slice(0, 100)) {
    const allowed = new Set([a.question, ...variantPool(a)]);
    for (const lvl of ['easier', 'harder'] as const) for (const q of buildRounds(a, lvl)) assert.ok(allowed.has(q.question), a.id);
  }
});
