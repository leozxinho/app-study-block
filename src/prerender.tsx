/* eslint-disable react-refresh/only-export-components -- entrada do build SSR, não é uma tela */
/**
 * Entrada do pré-render (build SSR do Vite, ver scripts/prerender.mjs): gera o HTML estático
 * das páginas públicas (landing, privacidade, termos): entregues só como HTML + CSS, sem o JavaScript do app.
 */
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { LandingPage } from './pages/LandingPage';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import { FAQ, PRODUCT } from './config/product';
import { PUBLIC_PAGES, SITE_DESCRIPTION, SITE_TITLE } from './config/pages';

const ELEMENTS: Record<string, ReactElement> = { '/': <LandingPage />, '/privacidade': <PrivacyPage />, '/termos': <TermsPage /> };

/** HTML de uma página pública (as de PUBLIC_PAGES). */
export function renderPage(path: string): string {
  return renderToString(<MemoryRouter initialEntries={[path]}>{ELEMENTS[path]}</MemoryRouter>);
}

export { FAQ, PRODUCT, PUBLIC_PAGES, SITE_TITLE, SITE_DESCRIPTION };
