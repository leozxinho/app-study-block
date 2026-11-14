import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Star, Zap, CheckCircle, Trophy, MapPin, Flame, ShoppingBag } from 'lucide-react';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { MinecraftCard } from '../components/ui/MinecraftCard';
import { XPBar } from '../components/ui/XPBar';
import { AchievementCard } from '../components/ui/AchievementCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { progressService } from '../services/progressService';
import { LEVELS, BIOMES } from '../lib/constants';
import type { StudentProgress } from '../types';
import { Mob } from '../components/mobs';
import {
  ACHIEVEMENTS,
  getDailyStreak,
  getLastWeek,
  useGameStats,
} from '../services/gameStatsService';

interface LocalStats {
  xp: number;
  level: number;
  completedActivities: StudentProgress[];
  achievements: string[];
  stars: number;
}


export function StudentDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<LocalStats>({
    xp: 0,
    level: 1,
    completedActivities: [],
    achievements: [],
    stars: 0,
  });

  useEffect(() => {
    const localStats = progressService.getLocalStats();
    setStats(localStats);
  }, []);

  const game = useGameStats();

  // Link "Conquistas" do header: /dashboard#conquistas rola até a seção
  const location = useLocation();
  useEffect(() => {
    if (location.hash !== '#conquistas') return;
    const t = setTimeout(() => document.getElementById('conquistas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
    return () => clearTimeout(t);
  }, [location.hash]);
  const dailyStreak = getDailyStreak(game);
  const week = getLastWeek(game);
  const playedToday = week[week.length - 1].played;
  // Desbloqueadas primeiro
  const achievements = [...ACHIEVEMENTS].sort(
    (a, b) => Number(Boolean(game.unlocked[b.id])) - Number(Boolean(game.unlocked[a.id]))
  );

  const currentLevel = LEVELS[Math.min(stats.level - 1, LEVELS.length - 1)] || LEVELS[0];

  const getBiomeProgress = (index: number) => {
    const completedCount = stats.completedActivities?.length || 0;
    if (index === 0) return Math.min(completedCount * 20, 100);
    if (index === 1) return Math.min(Math.max((completedCount - 2) * 15, 0), 100);
    if (index === 2) return Math.min(Math.max((completedCount - 4) * 10, 0), 100);
    return 0;
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 12 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-minecraft-sky via-blue-100 to-green-50">
      <MinecraftHeader studentName="Explorador" showNav />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Avatar & Greeting */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-gradient-to-br from-minecraft-emerald to-minecraft-green rounded-lg flex items-end justify-center pb-1 pixel-border"
          >
            <Mob type={game.skin.character} skin={game.skin} size={48} animation="idle" title="Seu personagem" />
          </motion.div>
          <div>
            <h1 className="font-minecraft text-lg sm:text-xl text-gray-800">
              Olá, Explorador! 👋
            </h1>
            <p className="font-body text-sm text-gray-600">
              Continue sua jornada de aprendizado!
            </p>
          </div>
        </motion.div>

        {/* XP Bar & Level */}
        <motion.div variants={itemVariants}>
          <MinecraftCard>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentLevel.icon}</span>
                  <div>
                    <p className="font-minecraft text-sm text-minecraft-gold">
                      Nível {currentLevel.level}
                    </p>
                    <p className="font-body text-xs text-gray-500">{currentLevel.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body text-xs text-gray-500">
                    {stats.xp} / {currentLevel.maxXP} XP
                  </p>
                </div>
              </div>
              <XPBar currentXP={stats.xp} currentLevel={stats.level} />
            </div>
          </MinecraftCard>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <Star className="w-5 h-5 text-yellow-500" />,
              label: 'Estrelas',
              value: stats.stars || 0,
              color: 'from-yellow-50 to-amber-50',
            },
            {
              icon: <Zap className="w-5 h-5 text-purple-500" />,
              label: 'XP Total',
              value: stats.xp || 0,
              color: 'from-purple-50 to-violet-50',
            },
            {
              icon: <CheckCircle className="w-5 h-5 text-green-500" />,
              label: 'Atividades',
              value: stats.completedActivities?.length || 0,
              color: 'from-green-50 to-emerald-50',
            },
            {
              icon: <Trophy className="w-5 h-5 text-orange-500" />,
              label: 'Nível',
              value: currentLevel.level,
              color: 'from-orange-50 to-amber-50',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -3 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <MinecraftCard gradient={stat.color}>
                <div className="p-3 text-center">
                  <div className="flex justify-center mb-1">{stat.icon}</div>
                  <p className="font-minecraft text-lg text-gray-800">{stat.value}</p>
                  <p className="font-body text-xs text-gray-500">{stat.label}</p>
                </div>
              </MinecraftCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Sequência diária */}
        <motion.div variants={itemVariants}>
          <MinecraftCard gradient="from-orange-50 to-amber-100">
            <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                <Flame className="w-10 h-10 text-orange-600" aria-hidden="true" />
                <div>
                  <p className="font-minecraft text-2xl text-gray-900">{dailyStreak}</p>
                  <p className="font-body text-sm font-bold text-gray-800">
                    {dailyStreak === 1 ? 'dia seguido jogando' : 'dias seguidos jogando'}
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full">
                <ol className="grid grid-cols-7 gap-1.5" aria-label="Últimos 7 dias">
                  {week.map((d) => (
                    <li key={d.key} className="flex flex-col items-center gap-1">
                      <span
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-sm pixel-border flex items-center justify-center text-lg
                          ${d.played ? 'grass-block' : 'bg-gray-300'}
                          ${d.isToday ? 'ring-2 ring-orange-600 ring-offset-1' : ''}`}
                        aria-label={`${d.label}${d.isToday ? ' (hoje)' : ''}: ${d.played ? 'jogou' : 'não jogou'}`}
                      >
                        {d.played && <span aria-hidden="true">✔️</span>}
                      </span>
                      <span className={`font-body text-[11px] ${d.isToday ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {d.isToday ? 'Hoje' : d.label}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="font-body text-sm text-gray-800 mt-2 text-center sm:text-left">
                  {playedToday
                    ? 'Você já jogou hoje. Volte amanhã para aumentar a sequência! 🔥'
                    : dailyStreak > 0
                      ? 'Faça uma atividade hoje para não perder a sequência!'
                      : 'Faça uma atividade hoje para começar uma sequência!'}
                </p>
              </div>
            </div>
          </MinecraftCard>
        </motion.div>

        {/* Continue Adventure - Biomes */}
        <motion.div variants={itemVariants}>
          <h2 className="font-minecraft text-md text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-minecraft-green" />
            Continue sua aventura
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BIOMES.slice(0, 6).map((biome, index) => {
              const progress = getBiomeProgress(index);
              return (
                <motion.div
                  key={biome.id}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <MinecraftCard
                    hoverable
                    gradient={biome.unlocked ? biome.bgColor : undefined}
                    onClick={() => biome.unlocked && navigate('/adventure')}
                  >
                    <div className={`p-4 ${!biome.unlocked ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{biome.icon}</span>
                        <div className="flex-1">
                          <p className="font-minecraft text-xs text-white drop-shadow-md">
                            {biome.name}
                          </p>
                          {!biome.unlocked && (
                            <span className="text-[10px] font-body text-white/80">🔒 Bloqueado</span>
                          )}
                        </div>
                      </div>
                      {biome.unlocked && (
                        <div className="mt-2">
                          <ProgressBar value={progress} max={100} showLabel={false} />
                          <p className="font-body text-[10px] text-white/80 mt-1">
                            {progress}% completo
                          </p>
                        </div>
                      )}
                    </div>
                  </MinecraftCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div variants={itemVariants} id="conquistas" className="scroll-mt-4">
          <h2 className="font-minecraft text-md text-gray-700 mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-minecraft-gold" />
            Conquistas ({ACHIEVEMENTS.filter((a) => game.unlocked[a.id]).length}/{ACHIEVEMENTS.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={{
                  id: achievement.id,
                  name: achievement.name,
                  description: achievement.description,
                  icon_url: achievement.icon,
                  required_xp: 0,
                  created_at: game.unlocked[achievement.id] ?? '',
                }}
                unlocked={Boolean(game.unlocked[achievement.id])}
              />
            ))}
          </div>
        </motion.div>

        {/* Back button */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 pt-4 pb-8">
          <MinecraftButton variant="gold" size="lg" onClick={() => navigate('/loja')}>
            <ShoppingBag className="w-5 h-5 mr-2" aria-hidden="true" />
            Loja de Skins
          </MinecraftButton>
          <MinecraftButton
            variant="primary"
            size="lg"
            onClick={() => navigate('/adventure')}
          >
            🗺️ Voltar ao Mapa
          </MinecraftButton>
        </motion.div>
      </motion.div>
    </div>
  );
}
