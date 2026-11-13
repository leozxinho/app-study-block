import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Trophy, Star } from 'lucide-react';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { XPBar } from '../components/ui/XPBar';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { WorldSection } from '../components/adventure/WorldSection';
import { adventureService } from '../services/adventureService';
import { progressService } from '../services/progressService';
import { ADVENTURE_WORLDS, generateAdventureLevels, getWorldForLevel } from '../data/adventureWorlds';
import { LevelStatus } from '../types';

export function AdventureMapPage() {
  const navigate = useNavigate();
  const worldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const ageGroup = localStorage.getItem('minecraft_edu_age_group') || 'maternal';

  const levels = useMemo(() => generateAdventureLevels(ageGroup), [ageGroup]);
  const [levelProgress, setLevelProgress] = useState<Record<number, { status: LevelStatus; stars: number }>>({});
  const [adventureStats, setAdventureStats] = useState({ totalStars: 0, completedLevels: 0, currentLevel: 1, totalXP: 0 });
  const [localStats, setLocalStats] = useState({ xp: 0, level: 1 });

  useEffect(() => {
    const progress = adventureService.getLevelProgress(ageGroup);
    // Convert StudentLevelProgress to simplified format for WorldSection
    const simplified: Record<number, { status: LevelStatus; stars: number }> = {};
    for (const [key, val] of Object.entries(progress)) {
      simplified[Number(key)] = { status: val.status, stars: val.stars };
    }
    setLevelProgress(simplified);

    const aStats = adventureService.getAdventureStats(ageGroup);
    setAdventureStats(aStats);

    const stats = progressService.getLocalStats();
    setLocalStats(stats);
  }, [ageGroup]);

  // Determine current level (first available/unlocked level that is not completed)
  const currentLevel = useMemo(() => {
    for (const level of levels) {
      const prog = levelProgress[level.levelNumber];
      if (!prog || prog.status === 'available' || prog.status === 'in_progress') {
        return level.levelNumber;
      }
    }
    return levels.length > 0 ? levels[levels.length - 1].levelNumber : 1;
  }, [levels, levelProgress]);

  // Auto-scroll to current world on mount
  useEffect(() => {
    const cWorld = getWorldForLevel(currentLevel);
    if (cWorld && worldRefs.current[cWorld.id]) {
      setTimeout(() => {
        worldRefs.current[cWorld.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 500);
    }
  }, [currentLevel]);

  const handleLevelClick = useCallback(
    (levelNumber: number) => {
      navigate(`/adventure/${levelNumber}`);
    },
    [navigate]
  );

  const allCompleted = adventureStats.completedLevels >= 100;

  // Group levels by world
  const worldsWithLevels = useMemo(() => {
    return ADVENTURE_WORLDS.map((world) => {
      const worldLevels = levels.filter(
        (l) => l.levelNumber >= world.levelRange[0] && l.levelNumber <= world.levelRange[1]
      );
      const firstLevelProg = levelProgress[world.levelRange[0]];
      const isUnlocked = !firstLevelProg || firstLevelProg.status !== 'locked';
      return { world, levels: worldLevels, isUnlocked };
    });
  }, [levels, levelProgress]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-emerald-900">
      <MinecraftHeader showNav />

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900/80 backdrop-blur-sm border-b-2 border-green-500/30 px-4 py-3"
      >
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-yellow-300">
              ⭐ {adventureStats.totalStars}
            </span>
            <span className="flex items-center gap-1 text-cyan-300">
              💎 {localStats.xp} XP
            </span>
            <span className="flex items-center gap-1 text-green-300">
              ✅ {adventureStats.completedLevels}/100
            </span>
            <span className="flex items-center gap-1 text-purple-300">
              <Map className="w-4 h-4" /> Fase {currentLevel}
            </span>
          </div>
          <div className="w-full sm:w-48">
            <XPBar currentXP={localStats.xp} currentLevel={localStats.level} />
          </div>
        </div>
      </motion.div>

      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center py-6 px-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
          🗺️ Mapa da Aventura
        </h1>
        <p className="text-green-200 mt-2 text-lg">
          Complete as fases para avançar na sua jornada!
        </p>
        <nav aria-label="Mais diversão" className="mt-4 flex flex-wrap justify-center gap-2">
          <MinecraftButton variant="gold" size="sm" onClick={() => navigate('/album')}>
            📒 Álbum
          </MinecraftButton>
          <MinecraftButton variant="success" size="sm" onClick={() => navigate('/casa')}>
            🏠 Minha casa
          </MinecraftButton>
          <MinecraftButton variant="primary" size="sm" onClick={() => navigate('/relampago')}>
            ⚡ Desafio relâmpago
          </MinecraftButton>
        </nav>
      </motion.div>

      {/* Worlds */}
      <div className="max-w-4xl mx-auto px-4 pb-28 space-y-6">
        {worldsWithLevels.map(({ world, levels: worldLevels, isUnlocked }, index) => (
          <motion.div
            key={world.id}
            ref={(el) => { worldRefs.current[world.id] = el; }}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Trilha ligando um mundo ao próximo */}
            {index > 0 && (
              <div className="flex flex-col items-center -mt-4 mb-2" aria-hidden="true">
                {[0, 1, 2].map((d) => (
                  <span key={d} className={`w-2 h-4 rounded-full my-0.5 ${isUnlocked ? 'bg-minecraft-gold' : 'bg-white/25'}`} />
                ))}
              </div>
            )}
            <WorldSection
              world={world}
              levels={worldLevels}
              levelProgress={levelProgress}
              currentLevel={currentLevel}
              onLevelClick={handleLevelClick}
              isUnlocked={isUnlocked}
            />
          </motion.div>
        ))}

        {/* Botão fixo: continuar de onde parou (acima das abas) */}
        {!allCompleted && (
          <div className="fixed inset-x-0 z-30 flex justify-center px-4 pointer-events-none" style={{ bottom: 'calc(76px + env(safe-area-inset-bottom))' }}>
            <motion.button
              type="button"
              onClick={() => navigate(`/adventure/${currentLevel}`)}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1, scale: [1, 1.04, 1] }}
              transition={{ delay: 0.6, scale: { duration: 1.6, repeat: Infinity, delay: 1.2 } }}
              className="pointer-events-auto min-h-[56px] px-6 rounded-lg pixel-border bg-minecraft-gold hover:bg-yellow-400 border-b-4 border-yellow-700 font-minecraft text-sm sm:text-base text-gray-900 shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white"
            >
              ▶ CONTINUAR · FASE {currentLevel}
            </motion.button>
          </div>
        )}

        {/* All Complete Congrats */}
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center py-10 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-2xl border-2 border-yellow-400/50"
          >
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-300">
              🏆 Parabéns! Você completou toda a aventura!
            </h2>
            <p className="text-yellow-200 mt-2">
              Você é um verdadeiro mestre explorador!
            </p>
            <div className="flex justify-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
