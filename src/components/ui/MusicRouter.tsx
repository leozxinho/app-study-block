import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setMusic } from '../../lib/audio/music';

/** Faixas dos mundos (docs/audio/ROTEIRO-AUDIO.txt, seção 5.2). */
const WORLD_TRACKS = [
  'mundo-01-vila', 'mundo-02-floresta', 'mundo-03-mina', 'mundo-04-deserto', 'mundo-05-oceano',
  'mundo-06-neve', 'mundo-07-nether', 'mundo-08-castelo', 'mundo-09-end', 'mundo-10-grande',
];

/** Escolhe a música de cada tela. */
function trackFor(path: string): string | string[] | null {
  const level = path.match(/^\/adventure\/(\d+)/);
  if (level) {
    const n = Number(level[1]);
    const world = Math.min(Math.max(Math.ceil(n / 10), 1), 10);
    // Fase 10 de cada mundo: prova contra o chefe
    if (n % 10 === 0) return [`prova-chefe-${String(world).padStart(2, '0')}`, 'prova-chefe', WORLD_TRACKS[world - 1]];
    return [WORLD_TRACKS[world - 1], 'mapa-aventura'];
  }
  if (path.startsWith('/adventure')) return 'mapa-aventura';
  if (path.startsWith('/loja')) return ['loja', 'tema-principal'];
  if (path.startsWith('/album') || path.startsWith('/casa')) return ['album-casa', 'tema-principal'];
  if (path.startsWith('/relampago')) return ['tema-principal'];
  if (path.startsWith('/responsavel')) return 'area-dos-pais';
  if (path.startsWith('/activity')) return ['mapa-aventura', 'tema-principal'];
  return 'tema-principal';
}

export function MusicRouter() {
  const { pathname } = useLocation();
  useEffect(() => {
    setMusic(trackFor(pathname));
  }, [pathname]);
  return null;
}
