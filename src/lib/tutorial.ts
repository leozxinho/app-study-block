// Tutorial do responsável (aparece na 1ª entrada de cada usuário).

/**
 * Vídeo explicando a plataforma. Deixe vazio enquanto não existir.
 * Aceita link do YouTube (https://www.youtube.com/watch?v=... ou youtu.be/...) ou um arquivo .mp4.
 */
export const TUTORIAL_VIDEO_URL = '';

const KEY = (userId: string) => `minelearn_tutorial_seen:${userId}`;

export function hasSeenTutorial(userId: string): boolean {
  try {
    return localStorage.getItem(KEY(userId)) === '1';
  } catch {
    return false;
  }
}

export function markTutorialSeen(userId: string): void {
  try {
    localStorage.setItem(KEY(userId), '1');
  } catch {
    // sem localStorage: aparece de novo na próxima vez
  }
}

/** Link do YouTube vira endereço de "embed"; .mp4 continua igual. */
export function videoEmbed(url: string): { kind: 'youtube' | 'file'; src: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  return { kind: 'file', src: url };
}
