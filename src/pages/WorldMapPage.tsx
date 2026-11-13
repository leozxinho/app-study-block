import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BIOMES } from '../lib/constants';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { MinecraftCard } from '../components/ui/MinecraftCard';
import { XPBar } from '../components/ui/XPBar';
import { progressService } from '../services/progressService';
import { Lock } from 'lucide-react';
import { Biome } from '../types';
import { adventureService } from '../services/adventureService';

export function WorldMapPage() {
  const navigate = useNavigate();
  const stats = progressService.getLocalStats();

  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  // O responsável pode liberar tudo na Área dos Pais
  const allUnlocked = adventureService.areWorldsUnlocked();
  const xpNeeded = (index: number) => index * 100;

  const handleBiomeClick = (biome: Biome & { unlocked: boolean }, index: number) => {
    // Mesma regra do cadeado: sem XP suficiente, não entra
    if (!biome.unlocked) {
      setLockedMsg(`Faltam ${xpNeeded(index) - (stats.xp || 0)} XP para abrir ${biome.name}. Faça atividades para ganhar XP!`);
      setTimeout(() => setLockedMsg(null), 3000);
      return;
    }
    navigate(`/activities/${biome.category}`);
  };

  // Temas abrem por XP: os 3 primeiros sempre; depois 300, 400, 500... XP
  const biomesWithProgress = BIOMES.map((biome, index) => ({
    ...biome,
    unlocked: allUnlocked || index < 3 || (stats.xp || 0) >= xpNeeded(index),
    progress: Math.min(
      100,
      ((stats.completedActivities?.filter(
        (a) => a.activity_id?.startsWith(biome.category.slice(0, 3))
      )?.length || 0) / 3) * 100
    ),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-minecraft-sky to-blue-200">
      <MinecraftHeader studentName="Explorador" />

      <div className="container mx-auto px-4 py-6">
        {/* XP Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md mx-auto mb-8"
        >
          <XPBar currentXP={stats.xp || 0} currentLevel={stats.level || 1} />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="font-minecraft text-xl sm:text-2xl text-minecraft-dark-green drop-shadow-lg mb-2">
            🗺️ Mundo da Aprendizagem
          </h1>
          <p className="font-body text-sm text-gray-600">
            Explore os biomas e complete as atividades!
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-6 mb-8"
        >
          <div className="bg-white/80 rounded-lg px-4 py-2 pixel-border text-center">
            <p className="text-2xl">⭐</p>
            <p className="font-minecraft text-xs">{stats.stars || 0}</p>
            <p className="font-body text-[10px] text-gray-500">Estrelas</p>
          </div>
          <div className="bg-white/80 rounded-lg px-4 py-2 pixel-border text-center">
            <p className="text-2xl">💎</p>
            <p className="font-minecraft text-xs">{stats.xp || 0}</p>
            <p className="font-body text-[10px] text-gray-500">XP</p>
          </div>
          <div className="bg-white/80 rounded-lg px-4 py-2 pixel-border text-center">
            <p className="text-2xl">✅</p>
            <p className="font-minecraft text-xs">{stats.completedActivities?.length || 0}</p>
            <p className="font-body text-[10px] text-gray-500">Completas</p>
          </div>
        </motion.div>

        {/* Biome Grid - World Map */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {biomesWithProgress.map((biome, index) => (
            <motion.div
              key={biome.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: 'spring', damping: 12 }}
            >
              <MinecraftCard
                hoverable={biome.unlocked}
                onClick={() => handleBiomeClick(biome, index)}
                gradient={biome.unlocked ? biome.bgColor : 'from-gray-400 to-gray-500'}
                className={`relative overflow-hidden ${!biome.unlocked ? 'opacity-60' : ''}`}
              >
                {/* Lock overlay */}
                {!biome.unlocked && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center">
                      <Lock className="mx-auto mb-1 text-white" size={24} />
                      <p className="font-minecraft text-[8px] text-white">
                        {xpNeeded(index)} XP
                      </p>
                      <p className="font-body text-[10px] text-white font-bold mt-1">
                        Faltam {xpNeeded(index) - (stats.xp || 0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="text-center relative z-0">
                  <motion.div
                    animate={biome.unlocked ? { y: [0, -5, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    className="text-4xl mb-3"
                  >
                    {biome.icon}
                  </motion.div>
                  <h3 className="font-minecraft text-[10px] sm:text-xs text-white mb-1 drop-shadow-lg">
                    {biome.name}
                  </h3>
                  <p className="font-body text-[10px] text-white/80 mb-3">
                    {biome.description}
                  </p>

                  {/* Progress */}
                  {biome.unlocked && (
                    <div className="mt-2">
                      <div className="w-full h-2 bg-black/20 rounded-sm overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${biome.progress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-white/80 rounded-sm"
                        />
                      </div>
                      <p className="font-body text-[9px] text-white/70 mt-1">
                        {Math.round(biome.progress)}% completo
                      </p>
                    </div>
                  )}
                </div>
              </MinecraftCard>
            </motion.div>
          ))}
        </div>

        {/* Bottom hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-8 pb-8"
        >
          <p className="font-body text-sm text-gray-500">
            🔒 Complete atividades para ganhar XP e desbloquear novos biomas!
          </p>
        </motion.div>
      </div>
      <AnimatePresence>
        {lockedMsg && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 inset-x-4 z-40 flex justify-center pointer-events-none"
          >
            <p className="bg-gray-900/90 text-white font-body font-bold text-sm px-4 py-3 rounded-lg pixel-border max-w-sm text-center">
              🔒 {lockedMsg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
