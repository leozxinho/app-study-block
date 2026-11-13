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
import { buildRounds, parseWordBuilder, roundCount, variantPool } from '../../src/lib/activityParsers';
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
