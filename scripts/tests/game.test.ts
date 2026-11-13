import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_THEMES, stickerForLevel, isBossLevel, themeForLevel } from '../../src/data/worldThemes.ts';
import { speechText } from '../../src/lib/voice.ts';
import { HOUSE_BLOCKS } from '../../src/data/houseBlocks.ts';

test('10 mundos, cada um com 10 figurinhas diferentes e um chefe', () => {
  assert.equal(WORLD_THEMES.length, 10);
  for (const theme of WORLD_THEMES) {
    assert.equal(theme.stickers.length, 10);
    assert.equal(new Set(theme.stickers.map((s) => s.name)).size, 10);
    assert.ok(theme.stickers.every((s) => s.icon && s.name));
    assert.ok(theme.boss.name);
  }
});

test('figurinha e chefe acompanham a fase', () => {
  assert.equal(stickerForLevel(1), WORLD_THEMES[0].stickers[0]);
  assert.equal(stickerForLevel(100), WORLD_THEMES[9].stickers[9]);
  assert.equal(themeForLevel(31), WORLD_THEMES[3]);
  assert.deepEqual([9, 10, 11, 20, 100].map(isBossLevel), [false, true, false, true, true]);
});

test('voz lê as contas em português e ignora emojis', () => {
  assert.equal(speechText('2 + 3 = ?'), '2 mais 3 é igual a quanto?');
  assert.equal(speechText('6 × 2 = ?'), '6 vezes 2 é igual a quanto?');
  assert.equal(speechText('8 ÷ 2 = ?'), '8 dividido por 2 é igual a quanto?');
  assert.equal(speechText('5 - 1 = ?'), '5 menos 1 é igual a quanto?');
  assert.equal(speechText('Isso aí! 🎉'), 'Isso aí!');
  assert.equal(speechText('Toque no 🐷 porco!'), 'Toque no porco!');
});

test('blocos da casinha liberam em ordem crescente', () => {
  const at = HOUSE_BLOCKS.map((b) => b.unlockAt);
  assert.deepEqual(at, [...at].sort((a, b) => a - b));
  assert.ok(HOUSE_BLOCKS.some((b) => b.unlockAt === 0), 'tem bloco desde o começo');
  assert.equal(new Set(HOUSE_BLOCKS.map((b) => b.id)).size, HOUSE_BLOCKS.length);
});

import { findMathUnitPair, unitByKey } from '../../src/lib/activityParsers/mathMobs.ts';

test('cada grupo da conta mostra o próprio item', () => {
  const pick = (q: string) => findMathUnitPair(q, unitByKey('diamante')).map((u) => u.key);
  assert.deepEqual(pick('2 esmeraldas + 3 rubis = quantas gemas?'), ['esmeralda', 'redstone']);
  assert.deepEqual(pick('2 porcos + 3 porcos = ?'), ['porco', 'porco']);
  assert.deepEqual(pick('4 creepers + 2 = ?'), ['creeper', 'creeper']);
  assert.deepEqual(pick('Quanto é 9 + 4?'), ['diamante', 'diamante']);
  assert.deepEqual(pick('5 ovelhas - 2 ovelhas = ?'), ['ovelha', 'ovelha']);
});

import { ITEM_SPRITES, spriteForEmoji } from '../../src/components/activities/shared/itemSprites.ts';

test('desenhos dos itens: linhas do mesmo tamanho e cores definidas', () => {
  assert.ok(Object.keys(ITEM_SPRITES).length >= 26);
  for (const [emoji, sprite] of Object.entries(ITEM_SPRITES)) {
    const w = sprite.rows[0].length;
    assert.ok(sprite.rows.every((r) => r.length === w), `${emoji} (${sprite.name}) tem linhas de tamanhos diferentes`);
    for (const ch of sprite.rows.join('')) {
      if (ch !== '.') assert.ok(sprite.palette[ch], `${emoji}: cor "${ch}" sem definição`);
    }
  }
  assert.equal(spriteForEmoji('❄️')?.name, 'Floco de neve', 'aceita emoji com seletor de variação');
  assert.equal(spriteForEmoji('🦄'), null);
});
