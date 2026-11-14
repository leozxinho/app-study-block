/**
 * Pré-render da landing (roda no fim do `npm run build`, depois do `vite build --ssr`).
 *
 * - dist/index.html → landing em HTML estático (H1, textos, FAQ), com canonical, og:*, JSON-LD.
 *   É o que "/" entrega; o React monta o app por cima no navegador.
 * - dist/app.html   → o shell vazio de antes (noindex), servido para as outras rotas do app
 *   (vercel.json e public/_redirects), para não piscar a landing no jogo.
 * - dist/sitemap.xml e dist/robots.txt com o domínio de VITE_SITE_URL.
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), 'VITE_');
const FALLBACK = 'https://minelearn.app';
const site = (env.VITE_SITE_URL || process.env.VITE_SITE_URL || FALLBACK).replace(/\/+$/, '');
if (!env.VITE_SITE_URL && !process.env.VITE_SITE_URL) {
  console.warn(`⚠️  VITE_SITE_URL não definido: usando ${FALLBACK} no canonical, og:url e sitemap.`);
}

const ssr = await import(pathToFileURL(resolve('dist-ssr/prerender.js')).href);
const html = readFileSync('dist/index.html', 'utf8');
if (!html.includes('<!--app-->') || !html.includes('<!--seo-->')) throw new Error('dist/index.html sem os marcadores <!--app--> / <!--seo-->');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const seo = [
  `<link rel="canonical" href="${site}/" />`,
  `<meta name="robots" content="index, follow" />`,
  `<meta property="og:url" content="${site}/" />`,
  `<meta property="og:image" content="${site}/og-image.png" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:image:alt" content="${esc(ssr.SITE_TITLE)}" />`,
  `<meta name="twitter:image" content="${site}/og-image.png" />`,
  jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'MineLearn', url: `${site}/`, inLanguage: 'pt-BR', description: ssr.SITE_DESCRIPTION }),
  jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ssr.FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }),
].join('\n    ');

// Shell das outras rotas: sem conteúdo e fora do buscador
writeFileSync('dist/app.html', html.replace('<!--seo-->', '<meta name="robots" content="noindex" />').replace('<!--app-->', ''));
// O React avisa que useLayoutEffect (do Link do router) não roda no servidor: esperado, a página não é hidratada
const consoleError = console.error;
console.error = (msg, ...rest) => (String(msg).includes('useLayoutEffect does nothing on the server') ? undefined : consoleError(msg, ...rest));
const landing = ssr.renderLanding();
console.error = consoleError;
writeFileSync('dist/index.html', html.replace('<!--seo-->', seo).replace('<!--app-->', landing));

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`
);
const robots = readFileSync('public/robots.txt', 'utf8').trimEnd();
writeFileSync('dist/robots.txt', `${robots}\n\nSitemap: ${site}/sitemap.xml\n`);

rmSync('dist-ssr', { recursive: true, force: true });
console.log(`Pré-render: dist/index.html (landing), dist/app.html, sitemap.xml e robots.txt (${site}).`);
