import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { Mob } from '../components/mobs';
import { useGameStats } from '../services/gameStatsService';
import { trainingList } from '../lib/training';

/** Treino: jogar de novo as atividades que a criança mais errou na semana. */
export function TrainingPage() {
  const navigate = useNavigate();
  const stats = useGameStats();
  const items = trainingList(stats.results);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-lime-100">
      <MinecraftHeader showNav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <Mob type={stats.skin.character} skin={stats.skin} size={56} animation="idle" title="Você" />
          <div>
            <h1 className="font-minecraft text-lg sm:text-xl text-gray-900">🎯 Treino</h1>
            <p className="font-body text-gray-800">As atividades em que você mais errou nesta semana. Bora treinar?</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl pixel-border p-6 text-center">
            <p className="text-5xl mb-2" aria-hidden="true">🌟</p>
            <p className="font-body text-lg font-bold text-gray-900">Nada para treinar!</p>
            <p className="font-body text-gray-700 mb-4">Você não errou nada nesta semana. Continue a aventura!</p>
            <MinecraftButton variant="gold" size="md" onClick={() => navigate('/adventure')}>
              🗺️ Voltar à aventura
            </MinecraftButton>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <motion.li
                key={item.activityId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl pixel-border p-4 flex items-center gap-3"
              >
                <span className="text-3xl" aria-hidden="true">{i === 0 ? '🔥' : '📘'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold text-gray-900 truncate">{item.title}</p>
                  <p className="font-body text-sm text-gray-600">
                    {item.errors} {item.errors === 1 ? 'erro' : 'erros'} nesta semana
                  </p>
                </div>
                <MinecraftButton variant="success" size="sm" onClick={() => navigate(`/treino/${item.activityId}`)}>
                  ▶ Treinar
                </MinecraftButton>
              </motion.li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
