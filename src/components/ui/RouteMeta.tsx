import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SITE_TITLE = 'MineLearn — aprender jogando num mundo de blocos';
export const SITE_DESCRIPTION =
  'Matemática, letras, cores e formas em uma aventura com voz, personagens e recompensas, para crianças de 0 a 10 anos estudarem em casa.';

/** Título e descrição de cada tela. Só "/" (a landing) é indexada; as telas do jogo e dos pais não. */
const META: { path: RegExp; title: string; description?: string; index?: boolean }[] = [
  { path: /^\/$/, title: SITE_TITLE, description: SITE_DESCRIPTION, index: true },
  { path: /^\/login$/, title: 'Entrar — MineLearn' },
  { path: /^\/inicio$/, title: 'Início — MineLearn' },
  { path: /^\/adventure\/\d+$/, title: 'Fase — MineLearn' },
  { path: /^\/adventure$/, title: 'Mapa da aventura — MineLearn' },
  { path: /^\/responsavel$/, title: 'Área dos Pais — MineLearn' },
  { path: /^\/loja$/, title: 'Loja — MineLearn' },
  { path: /^\/album$/, title: 'Álbum — MineLearn' },
  { path: /^\/casa$/, title: 'Casinha — MineLearn' },
  { path: /^\/relampago$/, title: 'Relâmpago — MineLearn' },
  { path: /^\/treino$/, title: 'Treino — MineLearn' },
  { path: /^\/treino\/.+$/, title: 'Treinando — MineLearn' },
  { path: /^\/dashboard$/, title: 'Meu painel — MineLearn' },
  { path: /^\/select-age$/, title: 'Escolher a idade — MineLearn' },
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
    document.title = meta?.title ?? 'MineLearn';
    setMeta('description', meta?.description ?? SITE_DESCRIPTION);
    setMeta('robots', meta?.index ? 'index, follow' : 'noindex');
  }, [pathname]);
  return null;
}
