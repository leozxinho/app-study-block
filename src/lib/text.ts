// Ajudantes de texto para ler as perguntas (sem React).

/** Minúsculas e sem acento: "Árvore" → "arvore". */
export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** A palavra (ou expressão) aparece inteira no texto? Ignora acento e maiúsculas. */
export function hasWord(text: string, word: string): boolean {
  const t = ` ${normalize(text).replace(/[^a-z0-9]+/g, ' ')} `;
  const w = ` ${normalize(word).replace(/[^a-z0-9]+/g, ' ').trim()} `;
  return t.includes(w);
}

/** Posição da palavra no texto (−1 se não tem). */
export function wordIndex(text: string, word: string): number {
  const t = ` ${normalize(text).replace(/[^a-z0-9]+/g, ' ')} `;
  return t.indexOf(` ${normalize(word).replace(/[^a-z0-9]+/g, ' ').trim()} `);
}

export function numbersIn(s: string): number[] {
  return (s.match(/\d+/g) ?? []).map(Number);
}

/** Separa em "letras visuais": um emoji com variações conta como 1. */
export function graphemes(s: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg('pt', { granularity: 'grapheme' }).segment(s), (x) => x.segment);
  return Array.from(s);
}

/** É um símbolo/emoji (não é letra, número, espaço ou pontuação comum)? */
export function isSymbol(g: string): boolean {
  return !/^[\p{L}\p{N}\s.,;:!?¿¡'"()[\]{}\-–—+=*/\\#@%&]$/u.test(g) && g.trim() !== '';
}

/** Tira do enunciado as dicas entre parênteses com números: "Quantas? (1-3)" → "Quantas?" */
export function stripNumberHints(question: string): string {
  return question.replace(/\s*\((?:\s*\d+\s*(?:[-–,]|ou|e)?\s*)+\)/gi, '').trim();
}

const VOWELS = 'AEIOUÁÉÍÓÚÂÊÔÃÕÀ';
const ONSET_CLUSTERS = ['BR', 'CR', 'DR', 'FR', 'GR', 'PR', 'TR', 'VR', 'BL', 'CL', 'FL', 'GL', 'PL'];
const DIGRAPHS = ['LH', 'NH', 'CH', 'QU', 'GU'];

/**
 * Divisão silábica simples (bom para palavras infantis comuns).
 * Para palavras com divisão especial, use o dicionário WORDS.
 */
export function syllabify(word: string): string[] {
  const w = word.toUpperCase();
  const isV = (c: string) => VOWELS.includes(c);
  const out: string[] = [];
  let cur = '';
  let i = 0;
  while (i < w.length) {
    cur += w[i];
    if (isV(w[i])) {
      // junta vogais seguidas (ditongo simples)
      while (i + 1 < w.length && isV(w[i + 1]) && !'ÁÉÍÓÚ'.includes(w[i + 1])) {
        i++;
        cur += w[i];
      }
      // consoantes depois da vogal
      let j = i + 1;
      while (j < w.length && !isV(w[j])) j++;
      const cons = w.slice(i + 1, j);
      if (j >= w.length) {
        cur += cons;
        i = j;
        break;
      }
      // quantas consoantes ficam nesta sílaba
      let keep: number;
      if (cons.length <= 1) keep = 0;
      else if (cons.length === 2) keep = ONSET_CLUSTERS.includes(cons) || DIGRAPHS.includes(cons) ? 0 : 1;
      else keep = ONSET_CLUSTERS.includes(cons.slice(-2)) || DIGRAPHS.includes(cons.slice(-2)) ? cons.length - 2 : cons.length - 1;
      cur += cons.slice(0, keep);
      out.push(cur);
      cur = '';
      i = i + 1 + keep;
      continue;
    }
    i++;
  }
  if (cur) out.push(cur);
  return out.filter(Boolean);
}
