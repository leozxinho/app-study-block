/**
 * Arquivos de áudio gravados (public/audio). O índice public/audio/manifest.json é gerado por
 * `npm run audio` (scripts/buildAudioManifest.ts) e diz quais arquivos existem e qual fala
 * corresponde a cada texto. Sem índice, nada é baixado e o jogo usa os sons sintetizados
 * e a voz do aparelho (src/lib/sounds.ts e src/lib/voice.ts).
 */

interface AudioManifest {
  files: string[];
  /** texto falado (sem emojis) → arquivo */
  lines: Record<string, string>;
}

const BASE = '/audio/';
let files = new Set<string>();
let lines: Record<string, string> = {};
let loading: Promise<void> | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let version = 0;
const listeners = new Set<() => void>();

/** Carrega o índice uma vez (chamar ao abrir o app). */
export function loadAudioIndex(): Promise<void> {
  if (loading) return loading;
  loading = fetch(`${BASE}manifest.json`, { cache: 'no-cache' })
    .then(async (res) => {
      // Hospedagem de SPA devolve o index.html para arquivo que não existe: confere o tipo
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return;
      const data = (await res.json()) as Partial<AudioManifest>;
      files = new Set(Array.isArray(data.files) ? data.files : []);
      lines = data.lines && typeof data.lines === 'object' ? data.lines : {};
      version++;
      listeners.forEach((l) => l());
      // Efeitos são pequenos: já deixa decodificados para tocar sem atraso
      [...files].filter((f) => f.startsWith('sfx/')).forEach((f) => void getBuffer(f));
    })
    .catch(() => undefined);
  return loading;
}

/** Muda quando o índice carrega (para telas que mostram algo só se houver áudio). */
export function subscribeAudioIndex(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function audioIndexVersion(): number {
  return version;
}

export function hasAudio(file: string): boolean {
  return files.has(file);
}

/** Arquivo da fala com este texto (se foi gravada). */
export function lineFile(text: string): string | null {
  const file = lines[text];
  return file && files.has(file) ? file : null;
}

/** Sorteia uma variação: base.mp3 ou base-1.mp3, base-2.mp3... (só as que existem). */
export function pickVariant(base: string): string | null {
  const options = [`${base}.mp3`, ...[1, 2, 3, 4].map((n) => `${base}-${n}.mp3`)].filter((f) => files.has(f));
  return options.length ? options[Math.floor(Math.random() * options.length)] : null;
}

export function audioUrl(file: string): string {
  return BASE + file;
}

let ctxRef: (() => AudioContext | null) | null = null;
/** sounds.ts informa o AudioContext que todos usam. */
export function setAudioContextProvider(get: () => AudioContext | null): void {
  ctxRef = get;
}

function getBuffer(file: string): Promise<AudioBuffer | null> {
  let p = buffers.get(file);
  if (!p) {
    const audio = ctxRef?.();
    if (!audio) return Promise.resolve(null);
    p = fetch(audioUrl(file))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => audio.decodeAudioData(data))
      .catch(() => null);
    buffers.set(file, p);
  }
  return p;
}

/** Toca um arquivo curto (efeito). Devolve false se não conseguiu (aí vale o som sintetizado). */
export function playBuffer(file: string, volume = 1): boolean {
  const audio = ctxRef?.();
  if (!audio || !files.has(file)) return false;
  void getBuffer(file).then((buffer) => {
    if (!buffer) return;
    const src = audio.createBufferSource();
    src.buffer = buffer;
    const gain = audio.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(audio.destination);
    src.start();
  });
  return true;
}
