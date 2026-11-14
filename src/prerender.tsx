/* eslint-disable react-refresh/only-export-components -- entrada do build SSR, não é uma tela */
/**
 * Entrada do pré-render (build SSR do Vite, ver scripts/prerender.mjs): gera o HTML estático
 * da landing para o buscador ler sem JavaScript. No navegador o React monta o app por cima.
 */
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { FAQ } from './config/product';
import { SITE_DESCRIPTION, SITE_TITLE } from './components/ui/RouteMeta';

export function renderLanding(): string {
  return renderToString(
    <MemoryRouter initialEntries={['/']}>
      <LandingPage />
    </MemoryRouter>
  );
}

export { FAQ, SITE_TITLE, SITE_DESCRIPTION };
