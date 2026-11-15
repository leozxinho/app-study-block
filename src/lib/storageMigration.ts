/**
 * O app se chamava MineLearn: as preferências salvas no aparelho usavam o prefixo minelearn_.
 * Aqui elas viram studyblock_* (uma vez, ao abrir). Importado primeiro no main.tsx, antes de
 * qualquer módulo ler o localStorage. Pode sair quando ninguém mais tiver dados dessa época.
 */
const OLD = 'minelearn_';
const NEW = 'studyblock_';
/** Chaves antigas que só são apagadas (não existem mais no app). */
const DROP = new Set(['minelearn_motion', 'minelearn_game_stats', 'minelearn_worlds_unlocked']);

try {
  for (const key of Object.keys(localStorage).filter((k) => k.startsWith(OLD))) {
    const value = localStorage.getItem(key);
    const renamed = NEW + key.slice(OLD.length);
    if (!DROP.has(key) && value !== null && localStorage.getItem(renamed) === null) localStorage.setItem(renamed, value);
    localStorage.removeItem(key);
  }
} catch {
  /* sem localStorage: nada a migrar */
}
