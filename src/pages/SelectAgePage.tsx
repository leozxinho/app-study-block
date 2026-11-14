import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AGE_GROUPS } from '../lib/constants';
import { AgeGroup } from '../types';
import { MinecraftCard } from '../components/ui/MinecraftCard';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { ArrowLeft } from 'lucide-react';

export function SelectAgePage() {
  const navigate = useNavigate();

  const handleSelectAge = (ageGroup: AgeGroup) => {
    localStorage.setItem('minecraft_edu_age_group', ageGroup);
    navigate('/adventure');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-sky via-blue-300 to-brand-green relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 block-pattern opacity-10" />

      {/* Back button */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-4 left-4 z-20"
      >
        <MinecraftButton variant="secondary" size="sm" onClick={() => navigate('/inicio')}>
          <ArrowLeft size={16} />
        </MinecraftButton>
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Title */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="font-minecraft text-2xl sm:text-3xl text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)] mb-4">
            Escolha sua Aventura!
          </h1>
          <p className="font-body text-lg text-white/90 max-w-md mx-auto">
            Selecione a faixa etária para começar a explorar
          </p>
        </motion.div>

        {/* Age Group Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {AGE_GROUPS.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.15, type: 'spring', damping: 12 }}
            >
              <MinecraftCard
                hoverable
                onClick={() => handleSelectAge(group.id)}
                className="text-center h-full"
                gradient={group.color}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  className="text-5xl mb-4"
                >
                  {group.icon}
                </motion.div>
                <h2 className="font-minecraft text-sm text-white mb-2 drop-shadow-lg">
                  {group.name}
                </h2>
                <p className="font-body text-xs text-white/90 mb-3 font-semibold">
                  {group.ageRange}
                </p>
                <p className="font-body text-xs text-white/80">
                  {group.description}
                </p>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="mt-4 inline-block bg-white/20 rounded-sm px-3 py-1"
                >
                  <span className="font-minecraft text-[10px] text-white">JOGAR →</span>
                </motion.div>
              </MinecraftCard>
            </motion.div>
          ))}
        </div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="font-body text-sm text-white/60">
            💡 Dica: Escolha a faixa etária adequada para a melhor experiência de aprendizagem!
          </p>
        </motion.div>
      </div>

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-4 bg-brand-green w-full" />
        <div className="h-12 bg-brand-dirt w-full" />
      </div>
    </div>
  );
}
