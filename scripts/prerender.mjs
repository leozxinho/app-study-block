/**
 * Pré-render das páginas públicas (roda no fim do `npm run build`, depois do `vite build --ssr`).
 *
 * - dist/index.html, dist/privacidade/index.html, dist/termos/index.html → HTML estático com título,
 *   descrição, canonical e og:* de cada página (a landing também com JSON-LD). Vão sem o JavaScript
 *   do app (só HTML + CSS; os botões são links).
 * - dist/app.html   → o shell vazio de antes (noindex), servido para as outras rotas do app
 *   (vercel.json e public/_redirects), para não piscar a landing no jogo.
 * - dist/sitemap.xml e dist/robots.txt com o domínio de VITE_SITE_URL.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), 'VITE_');
const FALLBACK = 'https://studyblock.com.br';
const site = (env.VITE_SITE_URL || process.env.VITE_SITE_URL || FALLBACK).replace(/\/+$/, '');
if (!env.VITE_SITE_URL && !process.env.VITE_SITE_URL) {
  console.warn(`⚠️  VITE_SITE_URL não definido: usando ${FALLBACK} no canonical, og:url e sitemap.`);
}

const ssr = await import(pathToFileURL(resolve('dist-ssr/prerender.js')).href);
const html = readFileSync('dist/index.html', 'utf8');
if (!html.includes('<!--app-->') || !html.includes('<!--seo-->')) throw new Error('dist/index.html sem os marcadores <!--app--> / <!--seo-->');
if (!ssr.PRODUCT.contactEmail || !ssr.PRODUCT.legalName) {
  console.warn('⚠️  Preencha contactEmail e legalName em src/config/product.ts: aparecem na política de privacidade e nos termos (LGPD).');
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
const urlOf = (path) => `${site}${path === '/' ? '/' : path}`;

/** Troca o conteúdo de uma tag <meta ... attr="name" content="..."> do modelo. */
const setMeta = (doc, attr, name, value) =>
  doc.replace(new RegExp(`(<meta ${attr}="${name}" content=")[^"]*(")`), `$1${esc(value)}$2`);

function seoFor(page) {
  const tags = [
    `<link rel="canonical" href="${urlOf(page.path)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:url" content="${urlOf(page.path)}" />`,
    `<meta property="og:image" content="${site}/og-image.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(ssr.SITE_TITLE)}" />`,
    `<meta name="twitter:image" content="${site}/og-image.png" />`,
  ];
  if (page.path === '/') {
    tags.push(
      jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'StudyBlock', url: `${site}/`, inLanguage: 'pt-BR', description: ssr.SITE_DESCRIPTION }),
      jsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ssr.FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      })
    );
  }
  return tags.join('\n    ');
}

// Shell das outras rotas: sem conteúdo e fora do buscador
writeFileSync('dist/app.html', html.replace('<!--seo-->', '<meta name="robots" content="noindex" />').replace('<!--app-->', ''));

// As páginas públicas não precisam do JavaScript do app: sem o script, não baixam React, router, Firebase etc.
const appScript = /\s*<script type="module"[^>]*src="\/assets\/[^"]+\.js"><\/script>/;
if (!appScript.test(html)) throw new Error('script do app não encontrado no dist/index.html');

// Landing: sem o app, a música de entrada toca por este script (os navegadores só deixam depois do 1º toque).
// Respeita as escolhas salvas no app (minelearn_music = off, minelearn_muted = 1).
const LANDING_MUSIC = `
    <script>
      (function () {
        try {
          if (localStorage.getItem('minelearn_music') === 'off' || localStorage.getItem('minelearn_muted') === '1') return;
        } catch (e) {}
        var music = new Audio('/audio/musica/entrada.mp3');
        music.loop = true;
        music.volume = 0.4;
        var start = function () {
          music.play().then(function () {
            ['pointerdown', 'touchend', 'keydown'].forEach(function (t) { document.removeEventListener(t, start); });
          }, function () {});
        };
        start();
        ['pointerdown', 'touchend', 'keydown'].forEach(function (t) { document.addEventListener(t, start); });
      })();
    </script>`;

// O React avisa que useLayoutEffect (do Link do router) não roda no servidor: esperado, a página não é hidratada
const consoleError = console.error;
console.error = (msg, ...rest) => (String(msg).includes('useLayoutEffect does nothing on the server') ? undefined : consoleError(msg, ...rest));
for (const page of ssr.PUBLIC_PAGES) {
  let doc = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  doc = setMeta(doc, 'name', 'description', page.description);
  doc = setMeta(doc, 'property', 'og:title', page.title);
  doc = setMeta(doc, 'property', 'og:description', page.description);
  doc = doc.replace('<!--seo-->', seoFor(page)).replace('<!--app-->', ssr.renderPage(page.path)).replace(appScript, page.path === '/' ? LANDING_MUSIC : '');
  const file = page.path === '/' ? 'dist/index.html' : `dist${page.path}/index.html`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, doc);
}
console.error = consoleError;

const urls = ssr.PUBLIC_PAGES.map(
  (p) => `  <url><loc>${urlOf(p.path)}</loc><changefreq>${p.path === '/' ? 'weekly' : 'yearly'}</changefreq><priority>${p.path === '/' ? '1.0' : '0.3'}</priority></url>`
);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
const robots = readFileSync('public/robots.txt', 'utf8').trimEnd();
writeFileSync('dist/robots.txt', `${robots}\n\nSitemap: ${site}/sitemap.xml\n`);

rmSync('dist-ssr', { recursive: true, force: true });
console.log(`Pré-render: ${ssr.PUBLIC_PAGES.map((p) => p.path).join(', ')} + app.html, sitemap.xml e robots.txt (${site}).`);
