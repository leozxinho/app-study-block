/**
 * Testes do helper de localStorage (src/lib/storage.ts).
 *
 *   npx tsx --test scripts/tests/storage.test.ts
 *
 * Usa node:test (sem dependências novas) e um localStorage falso em memória.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  private data = new Map<string, string>();
  failOnSet = false;
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) {
    if (this.failOnSet) throw new Error('QuotaExceededError');
    this.data.set(k, String(v));
  }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

const storage = new MemoryStorage();
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;

const { readJSON, writeJSON } = await import('../../src/lib/storage');

beforeEach(() => {
  storage.clear();
  storage.failOnSet = false;
});

test('readJSON: chave ausente devolve o fallback', () => {
  assert.deepEqual(readJSON('k', { xp: 0 }), { xp: 0 });
});

test('readJSON: JSON corrompido devolve o fallback em vez de lançar', () => {
  storage.setItem('k', '{');
  assert.deepEqual(readJSON('k', { xp: 0 }), { xp: 0 });
});

test('readJSON: valor que não é objeto (ex.: "null") devolve o fallback', () => {
  storage.setItem('k', 'null');
  assert.deepEqual(readJSON('k', { xp: 0 }), { xp: 0 });
  storage.setItem('k', '42');
  assert.deepEqual(readJSON('k', { xp: 0 }), { xp: 0 });
});

test('readJSON: JSON válido é devolvido', () => {
  storage.setItem('k', JSON.stringify({ xp: 7 }));
  assert.deepEqual(readJSON('k', { xp: 0 }), { xp: 7 });
});

test('writeJSON: grava e devolve true', () => {
  assert.equal(writeJSON('k', { a: 1 }), true);
  assert.equal(storage.getItem('k'), '{"a":1}');
});

test('writeJSON: cota estourada devolve false sem lançar', () => {
  storage.failOnSet = true;
  assert.equal(writeJSON('k', { a: 1 }), false);
  assert.equal(storage.getItem('k'), null);
});
