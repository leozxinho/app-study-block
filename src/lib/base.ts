/**
 * Pasta onde o site está publicado: "/" (domínio próprio, Vercel) ou "/app-study-block/" (GitHub Pages).
 * Vem de VITE_BASE_PATH no build (vite.config.ts). Use para caminhos de arquivos em public/ e links de fora do router.
 */
export const BASE_URL = import.meta.env.BASE_URL;

/** Caminho com a pasta do site: withBase('/audio/x.mp3') → '/app-study-block/audio/x.mp3' no GitHub Pages. */
export const withBase = (path: string) => BASE_URL + path.replace(/^\//, '');

/** basename do React Router ('' quando o site está na raiz). */
export const ROUTER_BASENAME = BASE_URL.replace(/\/$/, '');
