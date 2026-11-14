import { useSyncExternalStore } from 'react';
import { audioUrl, hasAudio, loadAudioIndex } from './library';
import { isMuted, subscribeMuted } from '../sounds';

/**
 * Música de fundo (public/audio/musica, ver docs/audio/ROTEIRO-AUDIO.txt seção 5).
 * Uma faixa em loop por tela, com fade ao trocar, mais baixa enquanto alguém fala.
 * "nome#início-fim" (em segundos) toca e repete só esse trecho da faixa (ex.: "entrada#13-30").
 * Sem o arquivo (ou com som/música desligados), fica em silêncio.
 */

const KEY = 'minelearn_music';
const VOLUME = 0.4;
const DUCKED = 0.1;
const FADE_MS = 500;

let enabled = readPref();
let wanted: string[] = []; // faixa da tela (a 1ª que existir)
let override: string | null = null; // minijogo, relâmpago...
let ducked = false;
let el: HTMLAudioElement | null = null;
let playing: string | null = null;
const listeners = new Set<() => void>();

function readPref(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

function fade(audio: HTMLAudioElement, to: number, then?: () => void): void {
  const from = audio.volume;
  const steps = 10;
  let i = 0;
  const id = window.setInterval(() => {
    i++;
    audio.volume = Math.max(0, Math.min(1, from + ((to - from) * i) / steps));
    if (i >= steps) {
      clearInterval(id);
      then?.();
    }
  }, FADE_MS / steps);
}

/** "entrada#13-30" → arquivo musica/entrada.mp3, trecho de 13 s a 30 s. */
function parseTrack(track: string): { file: string; start: number; end: number | null } {
  const m = track.match(/^(.+)#(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  return m ? { file: `musica/${m[1]}.mp3`, start: Number(m[2]), end: Number(m[3]) } : { file: `musica/${track}.mp3`, start: 0, end: null };
}

/** Repete só o trecho [start, end) da faixa. */
function loopSegment(audio: HTMLAudioElement, start: number, end: number): void {
  audio.loop = false;
  const restart = () => {
    audio.currentTime = start;
    if (audio.paused && audio === el) audio.play().catch(() => undefined);
  };
  audio.addEventListener('loadedmetadata', () => (audio.currentTime = start), { once: true });
  audio.addEventListener('timeupdate', () => {
    if (audio.currentTime >= end) restart();
  });
  audio.addEventListener('ended', restart);
}

function apply(): void {
  const tracks = override ? [override] : wanted;
  const track = tracks.find((t) => hasAudio(parseTrack(t).file)) ?? null;
  const ok = track && enabled && !isMuted() ? track : null;
  const target = ducked ? DUCKED : VOLUME;

  if (ok && ok === playing && el) {
    fade(el, target);
    if (el.paused) el.play().catch(() => undefined);
    return;
  }
  if (el) {
    const old = el;
    fade(old, 0, () => old.pause());
    el = null;
    playing = null;
  }
  if (!ok) return;
  const { file, start, end } = parseTrack(ok);
  const audio = new Audio(audioUrl(file));
  audio.loop = true;
  if (end !== null) loopSegment(audio, start, end);
  audio.volume = 0;
  el = audio;
  playing = ok;
  // Antes do 1º toque o navegador bloqueia: tenta de novo no próximo toque
  audio.play().then(() => fade(audio, target), () => undefined);
}

// Navegadores só deixam tocar depois de um toque/clique
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => {
    if (el && el.paused) el.play().then(() => el && fade(el, ducked ? DUCKED : VOLUME), () => undefined);
  });
  subscribeMuted(apply);
}

/** Faixa da tela atual (lista = a 1ª que existir; null = silêncio). */
export function setMusic(track: string | string[] | null): void {
  wanted = track === null ? [] : Array.isArray(track) ? track : [track];
  void loadAudioIndex().then(apply);
}

/** Faixa por cima da tela (minijogo, relâmpago); null volta para a da tela. */
export function setMusicOverride(track: string | null): void {
  override = track;
  void loadAudioIndex().then(apply);
}

/** Alguém está falando: abaixa a música. */
export function duckMusic(on: boolean): void {
  if (ducked === on) return;
  ducked = on;
  if (el && playing) fade(el, on ? DUCKED : VOLUME);
}

/** Toca uma vinheta curta (vitória, revanche) por cima, abaixando a música. */
export function playJingle(track: string): void {
  const file = `musica/${track}.mp3`;
  if (!enabled || isMuted() || !hasAudio(file)) return;
  const jingle = new Audio(audioUrl(file));
  jingle.volume = 0.7;
  duckMusic(true);
  const done = () => duckMusic(false);
  jingle.addEventListener('ended', done);
  jingle.play().catch(done);
}

export function setMusicEnabled(value: boolean): void {
  enabled = value;
  try {
    localStorage.setItem(KEY, value ? 'on' : 'off');
  } catch {
    /* ignora */
  }
  apply();
  listeners.forEach((l) => l());
}

export function useMusicEnabled(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => enabled,
    () => enabled
  );
}

/** A música existe? (para mostrar o botão só quando houver faixas gravadas) */
export function hasAnyMusic(): boolean {
  return ['entrada', 'tema-principal', 'mapa-aventura', 'mundo-01-vila'].some((t) => hasAudio(`musica/${t}.mp3`));
}
