/**
 * Leitura e escrita de JSON no localStorage sem derrubar o app.
 * Valor corrompido, editado à mão ou localStorage indisponível/cheio não lança erro.
 */

/** Lê a chave como JSON. Ausente, inválido ou que não seja objeto: devolve o fallback. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Grava o valor como JSON. Devolve false se não conseguiu (cota cheia, sem localStorage). */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
