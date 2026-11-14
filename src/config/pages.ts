/** Textos de SEO do site (usados pelo RouteMeta e pelo pré-render). */
export const SITE_TITLE = 'MineLearn — aprender jogando num mundo de blocos';
export const SITE_DESCRIPTION =
  'Matemática, letras, cores e formas em uma aventura com voz, personagens e recompensas, para crianças de 0 a 10 anos estudarem em casa.';

/** Páginas públicas: pré-renderizadas no build (scripts/prerender.mjs), indexadas e no sitemap. */
export const PUBLIC_PAGES = [
  { path: '/', title: SITE_TITLE, description: SITE_DESCRIPTION },
  {
    path: '/privacidade',
    title: 'Política de privacidade — MineLearn',
    description: 'Quais dados o MineLearn usa, para quê, com quem compartilha e os direitos da família pela LGPD.',
  },
  {
    path: '/termos',
    title: 'Termos de uso — MineLearn',
    description: 'Regras de uso do MineLearn: conta do responsável, contas das crianças, assinatura, cancelamento e contato.',
  },
];
