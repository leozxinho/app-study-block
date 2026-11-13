import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Activity, ActivityCategory, AgeGroup } from '../types';
import { activityService } from '../services/activityService';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { MinecraftCard } from '../components/ui/MinecraftCard';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { ArrowLeft, Star, Zap } from 'lucide-react';
import { progressService } from '../services/progressService';

const CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  matematica: { name: 'Mina dos Números', icon: '⛏️', color: 'from-yellow-500 to-amber-600' },
  linguagem: { name: 'Floresta das Letras', icon: '🌳', color: 'from-green-400 to-green-600' },
  cores: { name: 'Vale das Cores', icon: '🌈', color: 'from-pink-400 to-rose-500' },
  formas: { name: 'Montanha das Formas', icon: '🔷', color: 'from-blue-400 to-indigo-500' },
  natureza: { name: 'Fazenda dos Animais', icon: '🐑', color: 'from-amber-400 to-orange-500' },
  coordenacao: { name: 'Campo de Treino', icon: '🎯', color: 'from-teal-400 to-cyan-500' },
  desafios: { name: 'Castelo dos Desafios', icon: '🏰', color: 'from-purple-500 to-violet-600' },
};

export function ActivityListPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const stats = progressService.getLocalStats();
  const ageGroup = localStorage.getItem('minecraft_edu_age_group') || 'maternal';

  // Sem tema (/activities, link "Atividades" do header): mostra todas as atividades da faixa etária
  const categoryInfo = category
    ? CATEGORY_INFO[category] || CATEGORY_INFO.matematica
    : { name: 'Todas as Atividades', icon: '📚', color: 'from-sky-400 to-blue-500' };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await activityService.getActivities(
          ageGroup as AgeGroup,
          category as ActivityCategory
        );
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [category, ageGroup]);

  const isActivityCompleted = (activityId: string) => {
    return stats.completedActivities?.some((p) => p.activity_id === activityId) || false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-minecraft-sky to-blue-100">
      <MinecraftHeader studentName="Explorador" />

      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <MinecraftButton variant="secondary" size="sm" onClick={() => navigate('/world')}>
            <span className="flex items-center gap-1">
              <ArrowLeft size={14} /> Voltar ao Mapa
            </span>
          </MinecraftButton>
        </motion.div>

        {/* Category Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mt-6 mb-8"
        >
          <div className="text-5xl mb-3">{categoryInfo.icon}</div>
          <h1 className="font-minecraft text-lg sm:text-xl text-minecraft-dark-green">
            {categoryInfo.name}
          </h1>
          <p className="font-body text-sm text-gray-600 mt-2">
            {activities.length} atividades disponíveis
          </p>
        </motion.div>

        {/* Activity Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-4xl"
            >
              ⛏️
            </motion.div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🏗️</p>
            <p className="font-body text-gray-600">
              Atividades em construção! Volte em breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {activities.map((activity, index) => {
              const completed = isActivityCompleted(activity.id);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MinecraftCard
                    hoverable
                    onClick={() => navigate(`/activity/${activity.id}`)}
                    className={`relative ${completed ? 'ring-2 ring-minecraft-emerald' : ''}`}
                  >
                    {/* Completed badge */}
                    {completed && (
                      <div className="absolute top-2 right-2 bg-minecraft-emerald rounded-full p-1">
                        <Star size={14} className="text-white fill-white" />
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoryInfo.color} flex items-center justify-center text-xl pixel-border`}>
                        {categoryInfo.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-minecraft text-[10px] text-gray-800 mb-1">
                          {activity.title}
                        </h3>
                        <p className="font-body text-xs text-gray-500 mb-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs font-body text-minecraft-gold">
                            <Zap size={12} /> {activity.points} XP
                          </span>
                          <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${
                            activity.difficulty === 'facil'
                              ? 'bg-green-100 text-green-700'
                              : activity.difficulty === 'medio'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {activity.difficulty === 'facil' ? '⭐ Fácil' :
                             activity.difficulty === 'medio' ? '⭐⭐ Médio' : '⭐⭐⭐ Difícil'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </MinecraftCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
