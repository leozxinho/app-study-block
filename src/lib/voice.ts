import { useSyncExternalStore } from 'react';
import { audioUrl, hasAudio, lineFile } from './audio/library';
import { duckMusic } from './audio/music';

// Voz do app: lê as perguntas e as falas do mascote (ajuda quem ainda não lê).
// Só fala gravada (public/audio/voz, ver docs/audio/ROTEIRO-AUDIO.txt), nunca a voz do aparelho:
// texto sem gravação toca uma frase gravada parecida (similarText) ou fica em silêncio.
// Liga/desliga fica salvo neste navegador.

const KEY = 'studyblock_voice';
const listeners = new Set<() => void>();

function readPref(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

let enabled = readPref();

export function isVoiceSupported(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

export function setVoiceEnabled(value: boolean): void {
  enabled = value;
  try {
    localStorage.setItem(KEY, value ? 'on' : 'off');
  } catch {
    /* ignora */
  }
  if (!value) stopSpeaking();
  listeners.forEach((l) => l());
}

export function useVoiceEnabled(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => enabled,
    () => enabled
  );
}

/** Tira emojis e símbolos que a voz leria de forma estranha. */
export function speechText(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/[×x](?=\s*\d)/g, ' vezes ')
    .replace(/÷/g, ' dividido por ')
    .replace(/\s-\s/g, ' menos ')
    .replace(/\+/g, ' mais ')
    .replace(/=\s*\?/g, ' é igual a quanto?')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- falas gravadas ----------

let current: HTMLAudioElement | null = null;
/** Falas que "têm a vez" (apresentação do chefe...): enquanto tocam, outras falas esperam. */
let holding = false;
/** Última fala que chegou durante uma fala com a vez (toca logo depois). */
let pending: (() => void) | null = null;
/** Falas em fila: tocam uma depois da outra (fim de fase, conquistas). */
const queue: string[] = [];

/** Tira as dicas "(1 ou 2)" das perguntas, como na tela e no CSV de gravação. */
const withoutHints = (t: string) => t.replace(/\s*\([^)]*\d[^)]*\)/g, '').trim();

function wholeLineFile(text: string): string | null {
  return lineFile(speechText(text)) ?? lineFile(speechText(withoutHints(text)));
}

/** Cor da pergunta ("VERMELHA") no masculino, como nas frases gravadas ("Qual é vermelho?"). */
const colorWord = (c: string) => {
  const w = c.toLowerCase();
  return w.endsWith('a') && w !== 'laranja' ? `${w.slice(0, -1)}o` : w;
};
const PLACE = / (?:do|no|da|na) Reino d(?:e|as) (?:Fogo|Estrelas)/;

/**
 * Frases gravadas parecidas com um texto que ainda não tem gravação (ex.: perguntas com os nomes
 * novos, antes de gerar as falas). Em ordem de preferência; quem chama toca a 1ª que tiver gravação.
 */
const SIMILAR: [RegExp, (m: RegExpMatchArray) => string[]][] = [
  [PLACE, (m) => [m.input!.replace(PLACE, '')]],
  [/^Encontre (?:os|as|todos os) pares/, () => ['Encontre todos os pares iguais!', 'Encontre os pares iguais!']],
  [/^Encontre .* iguais!$/, () => ['Encontre os pares iguais!', 'Encontre todos os pares iguais!']],
  [/\b(retângulo|quadrado|losango|círculo|triângulo|hexágono|oval)\b/, (m) => [`Qual é o ${m[1]}?`, `Toque no ${m[1]}!`]],
  [/^Qual é a cor (\p{Lu}+)/u, (m) => [`Qual é ${colorWord(m[1])}?`]],
  // Probleminhas ("Téo tinha 3 maçãs e ganhou mais 2. Quantas tem agora?")
  [/\d.*Quant[oa]s? .*\?$/, () => ['Quanto dá a conta?']],
  [/^Quant[oa]s? /, () => ['Quantos objetos?']],
];

/** Frase gravada parecida com o texto (has = tem gravação); null = nenhuma. */
export function similarText(text: string, has: (text: string) => boolean): string | null {
  const clean = withoutHints(speechText(text));
  for (const [re, alternatives] of SIMILAR) {
    const m = clean.match(re);
    const found = m && alternatives(m).find((t) => has(t));
    if (found) return found;
  }
  return null;
}

function recordedFor(text: string, file?: string): string | null {
  if (file && hasAudio(file)) return file;
  return wholeLineFile(text);
}

const OP_PIECE: Record<string, string> = { '+': 'mais', '-': 'menos', '×': 'vezes', x: 'vezes', '÷': 'dividido-por' };
const numPiece = (n: string) => `voz/numeros/n-${n.padStart(3, '0')}.mp3`;
const contaPiece = (name: string) => `voz/contas/${name}.mp3`;

/**
 * Conta sorteada montada com as peças gravadas (voz/numeros e voz/contas):
 * "Quanto é 9 + 5?" → quanto-e, n-009, mais, n-005; "9 + 5 = ?" → n-009, mais, n-005, igual-quanto.
 * null = não é um desses formatos. Quem chama confere se todas as peças existem.
 */
export function mathPieces(text: string): string[] | null {
  const t = text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();
  const ask = t.match(/^Quanto é (\d{1,3}) ([+\-×x÷]) (\d{1,3})\?$/);
  if (ask) return [contaPiece('quanto-e'), numPiece(ask[1]), contaPiece(OP_PIECE[ask[2]]), numPiece(ask[3])];
  const eq = t.match(/^(\d{1,3}) ([+\-×x÷]) (\d{1,3}) = \?$/);
  if (eq) return [numPiece(eq[1]), contaPiece(OP_PIECE[eq[2]]), numPiece(eq[3]), contaPiece('igual-quanto')];
  return null;
}

/** Peças gravadas para o texto, só se TODAS existem. */
function recordedPieces(text: string): string[] | null {
  const pieces = mathPieces(text);
  return pieces && pieces.every((f) => hasAudio(f)) ? pieces : null;
}

/** Tem voz gravada para este texto (a frase inteira ou montada com as peças, sem contar as parecidas)? */
export function hasRecordedVoice(text: string): boolean {
  return recordedFor(text) !== null || recordedPieces(text) !== null;
}

/** Toca várias falas gravadas emendadas (sem "a vez": a próxima fala interrompe, como speak). */
function playRecordedList(list: string[]): void {
  const next = (i: number) => {
    if (i < list.length) playRecordedVoice(list[i], () => next(i + 1));
    else playNextQueued();
  };
  next(0);
}

function playRecordedVoice(file: string, onEnd?: () => void): void {
  stopCurrent();
  const el = new Audio(audioUrl(file));
  current = el;
  const done = () => {
    if (current === el) {
      current = null;
      duckMusic(false);
      if (onEnd) onEnd();
      else playNextQueued();
    }
  };
  el.addEventListener('ended', done);
  el.addEventListener('error', done);
  duckMusic(true);
  el.play().catch((e: unknown) => {
    // Bloqueada porque ainda não houve toque na tela: toca no 1º toque (se nada mais tocou antes)
    if (e instanceof DOMException && e.name === 'NotAllowedError' && current === el) blocked = file;
    done();
  });
}

/** Última fala que o navegador bloqueou antes do 1º toque. */
let blocked: string | null = null;
if (typeof document !== 'undefined') {
  const retry = () => {
    const file = blocked;
    blocked = null;
    if (file && !current && enabled) playRecordedVoice(file);
  };
  ['pointerdown', 'touchend', 'keydown'].forEach((t) => document.addEventListener(t, retry, { capture: true }));
}

/**
 * Fala o texto (interrompe a fala anterior). force = mesmo com a voz desligada (botão 🔊).
 * file = fala gravada específica (ex.: a risada de cada chefe); se não existir, vale o texto.
 */
export function speak(text: string, { force = false, file }: { force?: boolean; file?: string } = {}): void {
  if (!enabled && !force) return;
  if (holding && !force) {
    pending = () => speak(text, { file });
    return;
  }
  if (force) releaseHold();
  const recorded = recordedFor(text, file);
  if (recorded) {
    playRecordedVoice(recorded);
    return;
  }
  // Sem a frase inteira gravada: tenta montar com as peças (contas sorteadas)
  const pieces = recordedPieces(text);
  if (pieces) {
    playRecordedList(pieces);
    return;
  }
  // Sem gravação: uma frase gravada parecida; sem nenhuma, silêncio (nunca a voz do aparelho)
  const similar = similarText(text, (t) => wholeLineFile(t) !== null);
  if (similar) playRecordedVoice(wholeLineFile(similar)!);
  else stopCurrent();
}

/** Toca a fala gravada só se ela existir. */
export function playVoiceFile(file: string): boolean {
  if (!enabled || !hasAudio(file)) return false;
  if (holding) {
    pending = () => playVoiceFile(file);
    return true;
  }
  playRecordedVoice(file);
  return true;
}

function playNextQueued(): void {
  if (holding || current) return;
  const next = queue.shift();
  if (next) playRecordedVoice(next);
}

/** Põe a fala gravada na fila (toca quando as anteriores terminarem). Sem o arquivo, ignora. */
export function queueVoiceFile(file: string): void {
  if (!enabled || !hasAudio(file)) return;
  queue.push(file);
  playNextQueued();
}

function releaseHold(): void {
  holding = false;
  const next = pending;
  pending = null;
  if (next) next();
  else playNextQueued();
}

/**
 * Toca as falas gravadas em sequência e com a vez: o que for dito enquanto isso
 * (pergunta, mascote) espera e toca no fim. Arquivos que não existem são pulados.
 */
export function playVoiceSequence(files: string[]): void {
  const list = enabled ? files.filter((f) => hasAudio(f)) : [];
  if (list.length === 0) return;
  holding = true;
  pending = null;
  const next = (i: number) => {
    if (i >= list.length) {
      releaseHold();
      return;
    }
    playRecordedVoice(list[i], () => next(i + 1));
  };
  next(0);
}

/** Para a fala que está tocando (sem mexer na fila). */
function stopCurrent(): void {
  if (current) {
    current.pause();
    current = null;
    duckMusic(false);
  }
}

/** Para tudo: a fala atual, a sequência com a vez e o que estava esperando. */
export function stopSpeaking(): void {
  blocked = null;
  holding = false;
  pending = null;
  queue.length = 0;
  stopCurrent();
}

