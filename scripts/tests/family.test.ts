import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canConfirmReset, summarizeDoc, validateChildInput } from '../../src/lib/family.ts';
import { dailyStreak } from '../../src/lib/days.ts';
import { emptyDoc } from '../../src/lib/store/progressStore.ts';

const ok = { name: 'Ana', username: 'ana.souza', password: 'segredo1', ageGroup: 'maternal' };

test('cadastro válido passa', () => {
  assert.equal(validateChildInput(ok), null);
  assert.equal(validateChildInput({ ...ok, username: '  Ana.Souza ' }), null, 'login é normalizado para minúsculo');
});

test('cadastro inválido explica o problema', () => {
  assert.match(validateChildInput({ ...ok, name: '  ' }) ?? '', /nome/i);
  assert.match(validateChildInput({ ...ok, username: 'a b' }) ?? '', /Login/);
  assert.match(validateChildInput({ ...ok, username: 'ab' }) ?? '', /Login/);
  assert.match(validateChildInput({ ...ok, password: '12345' }) ?? '', /6/);
  assert.match(validateChildInput({ ...ok, ageGroup: 'escola' }) ?? '', /faixa/i);
});

test('zerar só libera com criança marcada e ZERAR digitado', () => {
  assert.equal(canConfirmReset(0, 'ZERAR'), false);
  assert.equal(canConfirmReset(2, 'zera'), false);
  assert.equal(canConfirmReset(1, ' zerar '), true);
});

test('resumo soma fases, estrelas e conta a ofensiva', () => {
  const doc = {
    ...emptyDoc(),
    slices: {
      progress: { xp: 150, level: 2, completedActivities: [{}, {}] },
      adventure: {
        maternal: { levels: { 1: { status: 'completed', stars: 3 }, 2: { status: 'completed', stars: 2 }, 3: { status: 'available', stars: 0 } } },
        'pre-escola-1': { levels: { 1: { status: 'completed', stars: 1 } } },
      },
      game: { playDays: ['2026-11-12', '2026-11-13', '2026-11-10'], results: [{ type: 'counting', errors: 0, stars: 3, at: '' }], unlocked: { a: '', b: '' } },
      settings: { unlockAll: true },
    },
  };
  const s = summarizeDoc(doc, new Date(2026, 10, 13, 12));
  assert.equal(s.xp, 150);
  assert.equal(s.level, 2);
  assert.equal(s.completedLevels, 3);
  assert.equal(s.levelStars, 6);
  assert.equal(s.activitiesDone, 2);
  assert.equal(s.streak, 2);
  assert.equal(s.lastPlayed, '2026-11-13');
  assert.equal(s.achievements, 2);
  assert.equal(s.unlockAll, true);
});

test('resumo de conta zerada ou corrompida é tudo zero', () => {
  for (const doc of [null, emptyDoc(), { ...emptyDoc(), slices: { progress: 'x', adventure: [1], game: { playDays: 5 } } }]) {
    const s = summarizeDoc(doc as never);
    assert.equal(s.xp, 0);
    assert.equal(s.level, 1);
    assert.equal(s.completedLevels, 0);
    assert.equal(s.streak, 0);
    assert.equal(s.lastPlayed, null);
  }
});

test('ofensiva não quebra se ainda não jogou hoje', () => {
  const today = new Date(2026, 10, 13, 9);
  assert.equal(dailyStreak(['2026-11-11', '2026-11-12'], today), 2);
  assert.equal(dailyStreak(['2026-11-10', '2026-11-11'], today), 0);
});

import { strengths, weekActivity } from '../../src/lib/family.ts';

test('semana: conta atividades por dia, hoje por último', () => {
  const today = new Date(2026, 10, 13, 12);
  const at = (d: number) => new Date(2026, 10, d, 10).toISOString();
  const week = weekActivity([{ type: 'a', errors: 0, stars: 3, at: at(13) }, { type: 'a', errors: 0, stars: 3, at: at(13) }, { type: 'b', errors: 1, stars: 2, at: at(10) }, { type: 'b', errors: 1, stars: 2, at: at(1) }], today);
  assert.equal(week.length, 7);
  assert.equal(week[6].count, 2);
  assert.equal(week[6].isToday, true);
  assert.equal(week[3].count, 1);
  assert.equal(week.reduce((s, d) => s + d.count, 0), 3, 'fora da semana não conta');
});

test('ponto forte e onde precisa de ajuda', () => {
  const r = (type: string, stars: number) => ({ type, errors: 0, stars, at: '' });
  assert.deepEqual(strengths([r('counting', 3), r('counting', 3), r('letter-identification', 1), r('letter-identification', 2)]), { best: 'counting', worst: 'letter-identification' });
  assert.equal(strengths([r('counting', 3)]), null, 'pouca informação');
  assert.equal(strengths([r('a', 2), r('a', 2), r('b', 2), r('b', 2)]), null, 'tudo igual');
});

import { adultChallenge, secondsLeft } from '../../src/lib/screenTime.ts';

test('tempo de tela: quanto falta, dia novo zera e minutos extras somam', () => {
  assert.equal(secondsLeft(0, { day: '2026-11-13', seconds: 9999, extraMin: 0 }, '2026-11-13'), null, 'sem limite');
  assert.equal(secondsLeft(30, { day: '2026-11-13', seconds: 600, extraMin: 0 }, '2026-11-13'), 1200);
  assert.equal(secondsLeft(30, { day: '2026-11-13', seconds: 1900, extraMin: 0 }, '2026-11-13'), 0);
  assert.equal(secondsLeft(30, { day: '2026-11-13', seconds: 1900, extraMin: 15 }, '2026-11-13'), 800);
  assert.equal(secondsLeft(30, { day: '2026-11-12', seconds: 5000, extraMin: 15 }, '2026-11-13'), 1800, 'outro dia não conta');
  const c = adultChallenge(123);
  assert.match(c.question, /× \d/);
  assert.ok(c.answer >= 42 && c.answer <= 81);
});
