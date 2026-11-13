import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

/** As 4 abas da criança (embaixo da tela, como nos apps infantis). */
const TABS = [
  { path: '/adventure', match: ['/adventure', '/relampago', '/treino'], icon: '🗺️', label: 'Aventura' },
  { path: '/album', match: ['/album', '/casa'], icon: '📒', label: 'Coleção' },
  { path: '/loja', match: ['/loja'], icon: '🛍️', label: 'Loja' },
  { path: '/dashboard', match: ['/dashboard'], icon: '🙂', label: 'Eu' },
];

export function KidTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Espaço embaixo da página para a barra não cobrir o conteúdo
  useEffect(() => {
    document.body.classList.add('has-tabbar');
    return () => document.body.classList.remove('has-tabbar');
  }, []);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-stone-900 to-stone-800 border-t-4 border-stone-950 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="max-w-xl mx-auto grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <li key={tab.path}>
              <button
                type="button"
                onClick={() => navigate(tab.path)}
                aria-current={active ? 'page' : undefined}
                className={`relative w-full min-h-[64px] flex flex-col items-center justify-center gap-0.5 font-body text-xs font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-gold ${
                  active ? 'text-minecraft-gold' : 'text-white/75 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute inset-x-3 top-1 bottom-1 rounded-lg bg-white/10 border-2 border-minecraft-gold/60"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.span
                  className="relative text-2xl leading-none"
                  animate={active ? { y: [0, -4, 0] } : { y: 0 }}
                  transition={{ duration: 0.4 }}
                  aria-hidden="true"
                >
                  {tab.icon}
                </motion.span>
                <span className="relative">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
