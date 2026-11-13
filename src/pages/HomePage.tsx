import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { AuthModal } from '../components/auth/AuthModal';
import { IntroSplash } from '../components/intro/IntroSplash';

import { Mob, MobWalker, type MobType } from '../components/mobs';

// Cada mob anda numa velocidade diferente
const HOME_WALKERS: { type: MobType; size: number; duration: number; offset: number }[] = [
  { type: 'steve', size: 60, duration: 26, offset: 0.1 },
  { type: 'pig', size: 52, duration: 18, offset: 0.5 },
  { type: 'sheep', size: 52, duration: 22, offset: 0.3 },
  { type: 'cow', size: 56, duration: 30, offset: 0.7 },
  { type: 'chicken', size: 44, duration: 14, offset: 0.85 },
  { type: 'wolf', size: 50, duration: 16, offset: 0.6 },
  { type: 'villager', size: 60, duration: 34, offset: 0.2 },
  { type: 'creeper', size: 60, duration: 24, offset: 0.95 },
];

// A abertura toca a cada vez que o site é aberto/atualizado (F5).
// Esta variável zera ao recarregar a página, mas não ao navegar de volta para "/" dentro do site.
let introPlayed = false;

export function HomePage() {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !introPlayed);
  const endIntro = () => {
    introPlayed = true;
    setShowIntro(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {showIntro && <IntroSplash onDone={endIntro} />}
      {/* Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-minecraft-sky via-blue-300 to-blue-200" />

      {/* Sun */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-10 right-20 w-24 h-24 bg-yellow-300 rounded-sm shadow-lg shadow-yellow-300/50"
      />

      {/* Clouds */}
      {[
        { top: '8%', left: '-5%', delay: 0 },
        { top: '12%', left: '30%', delay: 2 },
        { top: '6%', left: '60%', delay: 4 },
        { top: '15%', left: '80%', delay: 1 },
      ].map((cloud, i) => (
        <motion.div
          key={i}
          initial={{ x: 0 }}
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, delay: cloud.delay }}
          className="absolute"
          style={{ top: cloud.top, left: cloud.left }}
        >
          <div className="flex">
            <div className="w-12 h-8 bg-white rounded-sm" />
            <div className="w-16 h-12 bg-white rounded-sm -mt-4" />
            <div className="w-12 h-8 bg-white rounded-sm" />
          </div>
        </motion.div>
      ))}

      {/* Mountains */}
      <div className="absolute bottom-32 left-0 right-0">
        <svg viewBox="0 0 1200 200" className="w-full">
          <polygon points="0,200 100,80 200,200" fill="#6B7280" />
          <polygon points="150,200 300,50 450,200" fill="#4B5563" />
          <polygon points="400,200 550,70 700,200" fill="#6B7280" />
          <polygon points="650,200 800,40 950,200" fill="#4B5563" />
          <polygon points="900,200 1050,80 1200,200" fill="#6B7280" />
          {/* Snow caps */}
          <polygon points="270,70 300,50 330,70" fill="white" />
          <polygon points="770,60 800,40 830,60" fill="white" />
        </svg>
      </div>

      {/* Trees */}
      <div className="absolute bottom-28 left-0 right-0 flex justify-around px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            className="flex flex-col items-center"
          >
            <div className="w-8 h-8 bg-minecraft-green rounded-sm" />
            <div className="w-10 h-10 bg-minecraft-green rounded-sm -mt-2" />
            <div className="w-12 h-12 bg-minecraft-dark-green rounded-sm -mt-2" />
            <div className="w-3 h-6 bg-minecraft-brown" />
          </motion.div>
        ))}
      </div>

      {/* Ground - Grass */}
      <div className="absolute bottom-0 left-0 right-0 h-28">
        <div className="h-4 bg-minecraft-green w-full" />
        <div className="h-24 bg-minecraft-dirt w-full block-pattern" />
      </div>

      {/* Faísca (herói de capa) voando pelo céu */}
      <div className="hero-fly-across z-[5] pointer-events-none" aria-hidden="true">
        <Mob type="faisca" size={56} animation="fly" />
      </div>

      {/* Mobs andando pelo chão (toque para pular) */}
      <div className="absolute bottom-28 left-0 right-0 h-24 z-20 pointer-events-none">
        {HOME_WALKERS.map((w) => (
          <MobWalker key={w.type} {...w} />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="text-center mb-8"
        >
          {/* Logo / Title */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-6"
          >
            <h1 className="font-minecraft text-3xl sm:text-5xl text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)] mb-2">
              MineLearn
            </h1>
            <p className="font-minecraft text-xs sm:text-sm text-minecraft-gold drop-shadow-[2px_2px_0px_rgba(0,0,0,0.6)]">
              Aprenda jogando!
            </p>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-body text-lg sm:text-xl text-white font-bold max-w-md mx-auto drop-shadow-lg"
          >
            Uma aventura educacional no mundo dos blocos!
          </motion.p>
        </motion.div>

        {/* Entrada (responsável ou criança): a aventura começa depois do login (tela /inicio) */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', damping: 10 }}
          className="cta-pulse rounded-md"
        >
          <MinecraftButton variant="secondary" size="md" onClick={() => setAuthOpen(true)}>
            🔐 Entrar: pais e crianças
          </MinecraftButton>
        </motion.div>

        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => navigate('/inicio')} />

        {/* Vantagens para os pais (informativo, não são botões) */}
        <motion.ul
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
          aria-label="Por que o MineLearn"
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 max-w-3xl bg-black/35 backdrop-blur-sm rounded-xl px-5 py-4"
        >
          {[
            { icon: '🎮', title: 'Aprende brincando', text: 'Fases curtas num mundo de blocos' },
            { icon: '📚', title: 'Do berçário ao 5º ano', text: 'Atividades para cada idade' },
            { icon: '🏆', title: 'Troféus e conquistas', text: 'XP, estrelas e roupas na loja' },
            { icon: '👨‍👧', title: 'Área dos Pais', text: 'Acompanhe o progresso de cada criança' },
          ].map((item) => (
            <li key={item.title} className="text-center text-white drop-shadow">
              <div className="text-3xl mb-1" aria-hidden="true">{item.icon}</div>
              <p className="font-body text-sm font-bold">{item.title}</p>
              <p className="font-body text-xs text-white/90">{item.text}</p>
            </li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}
