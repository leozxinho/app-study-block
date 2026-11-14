import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { DailyStatus } from '../ui/DailyStatus';
import { MusicButton } from '../ui/MusicButton';
import { KidTabBar } from './KidTabBar';

interface MinecraftHeaderProps {
  studentName?: string;
  /** Telas da criança: ofensiva/meta no topo e as 4 abas embaixo */
  showNav?: boolean;
}

/** Topo simples (logo, ofensiva, música) + abas embaixo nas telas da criança. */
export function MinecraftHeader({ studentName, showNav = true }: MinecraftHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-brand-dark-green to-brand-green px-4 py-2.5 shadow-lg pixel-border sticky top-0 z-40"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/inicio')}
            className="flex items-center gap-2 rounded focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis"
            aria-label="Início"
          >
            <span className="text-2xl" aria-hidden="true">⛏️</span>
            <span className="font-minecraft text-sm text-white hidden sm:block">StudyBlock</span>
          </button>

          {showNav && (
            <div className="flex items-center gap-2">
              <DailyStatus />
              <MusicButton className="w-9 h-9" />
            </div>
          )}

          {studentName && (
            <button
              type="button"
              onClick={() => navigate('/inicio')}
              className="flex items-center gap-2 text-white/80 hover:text-white p-2 rounded focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis"
              aria-label="Voltar ao início"
            >
              <span className="font-body text-sm font-bold hidden sm:block">{studentName}</span>
              <LogOut size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </motion.header>
      {showNav && <KidTabBar />}
    </>
  );
}
