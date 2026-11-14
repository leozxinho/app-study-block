import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PUBLIC_PAGES, SITE_DESCRIPTION } from '../../config/pages';

/** Título e descrição de cada tela. Só "/" (a landing) é indexada; as telas do jogo e dos pais não. */
const META: { path: RegExp; title: string; description?: string; index?: boolean }[] = [
  ...PUBLIC_PAGES.map((p) => ({ path: new RegExp(`^${p.path}$`), title: p.title, description: p.description, index: true })),
  { path: /^\/login$/, title: 'Entrar — StudyBlock' },
  { path: /^\/inicio$/, title: 'Início — StudyBlock' },
  { path: /^\/adventure\/\d+$/, title: 'Fase — StudyBlock' },
  { path: /^\/adventure$/, title: 'Mapa da aventura — StudyBlock' },
  { path: /^\/responsavel$/, title: 'Área dos Pais — StudyBlock' },
  { path: /^\/loja$/, title: 'Loja — StudyBlock' },
  { path: /^\/album$/, title: 'Álbum — StudyBlock' },
  { path: /^\/casa$/, title: 'Casinha — StudyBlock' },
  { path: /^\/relampago$/, title: 'Relâmpago — StudyBlock' },
  { path: /^\/treino$/, title: 'Treino — StudyBlock' },
  { path: /^\/treino\/.+$/, title: 'Treinando — StudyBlock' },
  { path: /^\/dashboard$/, title: 'Meu painel — StudyBlock' },
  { path: /^\/select-age$/, title: 'Escolher a idade — StudyBlock' },
];

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Atualiza document.title, a meta description e o robots a cada troca de tela. */
export function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = META.find((m) => m.path.test(pathname));
    document.title = meta?.title ?? 'StudyBlock';
    setMeta('description', meta?.description ?? SITE_DESCRIPTION);
    setMeta('robots', meta?.index ? 'index, follow' : 'noindex');
  }, [pathname]);
  return null;
}
