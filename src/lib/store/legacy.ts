/**
 * Dados salvos por versões antigas do app (uma chave por assunto, sem conta).
 * Na primeira conta que abrir neste aparelho, viram fatias do documento dela e as chaves antigas somem.
 */

const LEGACY_PROGRESS = 'minecraft_edu_progress';
const LEGACY_GAME = 'minelearn_game_stats';
const LEGACY_ADVENTURE = 'minecraft_edu_adventure_progress';
const LEGACY_WORLDS = 'minelearn_worlds_unlocked';

function parse(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' ? value : undefined;
  } catch {
    return undefined;
  }
}

export function importLegacyKeys(storage: Storage = localStorage, fallbackAge = 'maternal'): Record<string, unknown> | null {
  try {
    const keys = Object.keys(storage);
    const slices: Record<string, unknown> = {};

    const progress = parse(storage.getItem(LEGACY_PROGRESS));
    if (progress) slices.progress = progress;

    const game = parse(storage.getItem(LEGACY_GAME));
    if (game) slices.game = game;

    const adventure: Record<string, unknown> = {};
    for (const key of keys) {
      if (key.startsWith(`${LEGACY_ADVENTURE}:`)) {
        const value = parse(storage.getItem(key));
        if (value) adventure[key.slice(LEGACY_ADVENTURE.length + 1)] = value;
      }
    }
    // Versão mais antiga: um progresso só, de todas as faixas
    const single = parse(storage.getItem(LEGACY_ADVENTURE));
    if (single && !adventure[fallbackAge]) adventure[fallbackAge] = single;
    if (Object.keys(adventure).length) slices.adventure = adventure;

    if (storage.getItem(LEGACY_WORLDS) === '1') slices.settings = { unlockAll: true };

    const legacyKeys = keys.filter(
      (k) => k === LEGACY_PROGRESS || k === LEGACY_GAME || k === LEGACY_WORLDS || k === LEGACY_ADVENTURE || k.startsWith(`${LEGACY_ADVENTURE}:`)
    );
    legacyKeys.forEach((k) => storage.removeItem(k));

    return Object.keys(slices).length ? slices : null;
  } catch {
    return null;
  }
}
