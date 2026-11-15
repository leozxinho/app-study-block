import { useSyncExternalStore } from 'react';
import type { MobType } from '../components/mobs/mobSprites';

// Efeitos sonoros. Se o arquivo gravado existir (public/audio/sfx, ver docs/audio/ROTEIRO-AUDIO.txt),
// toca o arquivo; senão, gera o som na hora com Web Audio API.
import { pickVariant, playBuffer, setAudioContextProvider } from './audio/library';

export type SoundKind = 'correct' | 'wrong' | 'click' | 'break' | 'xp' | 'hiss' | 'explode' | 'star' | 'trophy' | 'levelup';

const MUTE_KEY = 'studyblock_muted';

// ---------- silenciar (salvo no localStorage) ----------

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readMuted();
const listeners = new Set<() => void>();

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // Sem localStorage: vale só nesta visita.
  }
  listeners.forEach((l) => l());
}

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** [silenciado, mudar]: atualiza todos os componentes que usam. */
export function useMuted(): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribeMuted, isMuted, isMuted);
  return [value, setMuted];
}

// ---------- motor de áudio ----------

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

setAudioContextProvider(getContext);

/** Arquivo gravado de cada efeito (sem a extensão; aceita variações -1, -2, -3). */
const SFX_FILES: Record<SoundKind, string> = {
  correct: 'sfx/acerto',
  wrong: 'sfx/erro',
  click: 'sfx/clique',
  break: 'sfx/quebrar-bloco',
  xp: 'sfx/xp-somando',
  hiss: 'sfx/creeper-chiado',
  explode: 'sfx/creeper-explosao',
  star: 'sfx/estrela',
  trophy: 'sfx/conquista',
  levelup: 'sfx/subiu-nivel',
};

/** Toca o arquivo gravado, se existir. */
function playRecorded(base: string): boolean {
  const file = pickVariant(base);
  return file ? playBuffer(file) : false;
}

function tone(
  audio: AudioContext,
  start: number,
  dur: number,
  from: number,
  to = from,
  wave: OscillatorType = 'square',
  volume = 0.07
): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, start);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function noise(audio: AudioContext, start: number, dur: number, cutoff: number, volume = 0.1): void {
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * dur), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start(start);
}

const SOUNDS: Record<SoundKind, (audio: AudioContext, t: number) => void> = {
  // "plim" subindo: dó, mi, sol, dó
  correct: (a, t) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(a, t + i * 0.08, 0.14, f, f, 'square', 0.06));
  },
  // dois tons descendo, suave (não assusta)
  wrong: (a, t) => {
    tone(a, t, 0.16, 330, 300, 'triangle', 0.12);
    tone(a, t + 0.16, 0.24, 247, 196, 'triangle', 0.12);
  },
  click: (a, t) => tone(a, t, 0.05, 700, 500, 'square', 0.04),
  // bloco quebrando: estalo + pedacinhos
  // chiado do creeper
  hiss: (a, t) => noise(a, t, 1.2, 5000, 0.05),
  // explosão: estrondo grave + chiado
  explode: (a, t) => {
    noise(a, t, 0.9, 600, 0.35);
    tone(a, t, 0.5, 120, 40, 'sawtooth', 0.15);
    noise(a, t + 0.05, 0.6, 2500, 0.12);
  },
  break: (a, t) => {
    noise(a, t, 0.18, 1800, 0.14);
    tone(a, t, 0.08, 160, 90, 'square', 0.06);
    noise(a, t + 0.07, 0.08, 900, 0.06);
  },
  // orbe de XP: blips rápidos subindo
  xp: (a, t) => {
    [880, 1175, 1568, 2093].forEach((f, i) => tone(a, t + i * 0.06, 0.09, f, f * 1.05, 'sine', 0.06));
  },
  // estrela caindo no lugar: "ping" curto e brilhante
  star: (a, t) => {
    tone(a, t, 0.08, 1320, 1760, 'square', 0.05);
    tone(a, t + 0.07, 0.16, 1760, 1760, 'sine', 0.05);
  },
  // troféu/conquista: fanfarra curta (sol, dó, mi, sol longo)
  trophy: (a, t) => {
    [[392, 0.1], [523, 0.1], [659, 0.1], [784, 0.35]].forEach(([f, d], i) => tone(a, t + i * 0.11, d, f, f, 'square', 0.06));
    tone(a, t + 0.33, 0.35, 1568, 1568, 'sine', 0.03);
  },
  // subiu de nível: escala rápida subindo
  levelup: (a, t) => {
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => tone(a, t + i * 0.05, 0.08, f, f, 'triangle', 0.07));
  },
};

/**
 * Libera o áudio. Precisa ser chamada DENTRO de um toque/clique/tecla do usuário:
 * os navegadores bloqueiam som antes disso.
 */
export function unlockAudio(): void {
  try {
    const audio = getContext();
    if (!audio) return;
    // som vazio (necessário no iPhone/Safari)
    const buffer = audio.createBuffer(1, 1, 22050);
    const src = audio.createBufferSource();
    src.buffer = buffer;
    src.connect(audio.destination);
    src.start(0);
  } catch {
    // sem áudio: ignora
  }
}

// Libera os efeitos no 1º toque/clique/tecla em qualquer lugar da tela
if (typeof document !== 'undefined') {
  const first = () => {
    unlockAudio();
    ['pointerdown', 'touchend', 'keydown'].forEach((t) => document.removeEventListener(t, first, { capture: true }));
  };
  ['pointerdown', 'touchend', 'keydown'].forEach((t) => document.addEventListener(t, first, { capture: true }));
}

export function playSound(kind: SoundKind): void {
  if (muted) return;
  if (playRecorded(SFX_FILES[kind])) return;
  try {
    const audio = getContext();
    if (audio) SOUNDS[kind](audio, audio.currentTime);
  } catch {
    // Sem áudio disponível: ignora.
  }
}

// ---------- sons curtos dos mobs ----------

const MOB_TONES: Record<MobType, [OscillatorType, number, number, number] | 'noise'> = {
  steve: ['square', 330, 520, 0.15],
  alex: ['square', 400, 640, 0.15],
  luna: ['square', 520, 780, 0.15],
  faisca: ['sine', 300, 1200, 0.3],
  creeper: 'noise',
  zombie: ['sawtooth', 140, 90, 0.3],
  skeleton: ['triangle', 900, 600, 0.1],
  enderman: ['sine', 700, 200, 0.35],
  pig: ['square', 260, 180, 0.2],
  sheep: ['triangle', 420, 380, 0.3],
  cow: ['sawtooth', 160, 120, 0.35],
  chicken: ['square', 900, 1300, 0.08],
  wolf: ['square', 500, 300, 0.12],
  villager: ['triangle', 220, 300, 0.25],
};

/** Nome do arquivo de cada mob (public/audio/mobs/<nome>-1.mp3). */
const MOB_FILES: Record<MobType, string> = {
  steve: 'steve', alex: 'alex', luna: 'luna', faisca: 'faisca', creeper: 'creeper', zombie: 'zumbi',
  skeleton: 'esqueleto', enderman: 'enderman', pig: 'porco', sheep: 'ovelha', cow: 'vaca',
  chicken: 'galinha', wolf: 'lobo', villager: 'morador',
};

/**
 * Efeito gravado com nome próprio (sfx/fumaca, sfx/bau-abre...). Sem o arquivo, toca o
 * efeito sintetizado parecido (fallback) ou nada.
 */
export function playSfx(base: string, fallback?: SoundKind): void {
  if (muted) return;
  if (playRecorded(base.startsWith('sfx/') ? base : `sfx/${base}`)) return;
  if (fallback) playSound(fallback);
}

/**
 * Som de cada item contado (1, 2, 3...). Com os arquivos sfx/conta-01..20 gravados,
 * a contagem sobe de tom; senão usa o clique.
 */
export function playCount(n: number, last = false): void {
  if (muted) return;
  if (last && playRecorded('sfx/conta-final')) return;
  if (playRecorded(`sfx/conta-${String(Math.min(Math.max(n, 1), 20)).padStart(2, '0')}`)) return;
  playSound(last ? 'correct' : 'click');
}

export function playMobSound(type: MobType): void {
  if (muted) return;
  if (playRecorded(`mobs/${MOB_FILES[type]}`)) return;
  try {
    const audio = getContext();
    if (!audio) return;
    const t = audio.currentTime;
    const spec = MOB_TONES[type];
    if (spec === 'noise') {
      noise(audio, t, 0.4, 4000, 0.08);
      return;
    }
    const [wave, from, to, dur] = spec;
    tone(audio, t, dur, from, to, wave, 0.08);
  } catch {
    // ignora
  }
}
