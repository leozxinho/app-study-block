import { useLocation, useNavigate } from 'react-router-dom';

/** Abas da Coleção: Álbum de figurinhas | Minha casa. */
export function CollectionTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tabs = [
    { path: '/album', label: '📒 Álbum' },
    { path: '/casa', label: '🏠 Minha casa' },
  ];
  return (
    <div role="tablist" aria-label="Coleção" className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-5">
      {tabs.map((t) => (
        <button
          key={t.path}
          type="button"
          role="tab"
          aria-selected={pathname === t.path}
          onClick={() => navigate(t.path)}
          className={`min-h-[48px] rounded-lg pixel-border font-body font-bold text-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-gold ${
            pathname === t.path ? 'bg-minecraft-gold text-gray-900' : 'bg-white/80 text-gray-800 hover:bg-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
