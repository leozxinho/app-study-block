import { playVoiceFile } from '../lib/voice';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { MinecraftCard } from '../components/ui/MinecraftCard';
import { Mob, MobWalker } from '../components/mobs';
import { authService } from '../services/authService';
import { getDailyStreak, useGameStats } from '../services/gameStatsService';
import { progressService } from '../services/progressService';
import { useSubscription } from '../services/subscriptionService';
import type { User } from '../types';
import { TutorialModal } from '../components/tutorial/TutorialModal';
import { hasSeenTutorial, markTutorialSeen } from '../lib/tutorial';

/**
 * Segunda tela, depois do login.
 * Criança: começa a aventura na faixa dela. Responsável: vai para a Área dos Pais
 * (ou deixa alguém jogar como visitante, sem salvar na conta de uma criança).
 */
export function StartPage() {
  const navigate = useNavigate();
  const game = useGameStats();
  const { skin } = game;
  const xp = progressService.getLocalStats();
  const streak = getDailyStreak(game);
  const [user, setUser] = useState<User | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const isChild = user?.role === 'student';
  const subscription = useSubscription();

  // Sem login, volta para entrar primeiro
  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      if (!u) navigate('/login', { replace: true });
      else {
        setUser(u);
        // Primeira entrada do responsável: mostra o tutorial
        if (u.role !== 'student' && !hasSeenTutorial(u.id)) setTutorialOpen(true);
        // 1ª vez da criança: o mascote dá oi e explica o botão
        if (u.role === 'student' && !hasSeenTutorial(u.id)) {
          playVoiceFile('voz/mascote/ola-crianca.mp3');
          markTutorialSeen(u.id);
        }
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-sky via-blue-300 to-blue-200" />

      {/* Chão com mobs andando */}
      <div className="absolute bottom-0 left-0 right-0 h-28">
        <div className="h-4 bg-brand-green w-full" />
        <div className="h-24 bg-brand-dirt w-full block-pattern" />
      </div>
      <div className="absolute bottom-28 left-0 right-0 h-24 pointer-events-none">
        <MobWalker type="pig" size={48} duration={20} offset={0.2} interactive={false} />
        <MobWalker type="sheep" size={48} duration={26} offset={0.7} interactive={false} />
        <MobWalker type="chicken" size={40} duration={15} offset={0.45} interactive={false} />
      </div>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        className="relative z-10 w-full max-w-md mb-24"
      >
        <MinecraftCard>
          <div className="p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-3">
              <Mob type={skin.character} skin={skin} size={isChild ? 120 : 72} animation={isChild ? 'celebrate' : 'idle'} title="Seu personagem" />
            </div>
            <h1 className="font-minecraft text-lg sm:text-xl text-gray-900 mb-1">Tudo pronto!</h1>
            {isChild ? (
              <>
                <p className="font-minecraft text-base sm:text-lg text-brand-dark-green mb-1">{user?.name}</p>
                <p className="font-body text-gray-700 mb-4">Bora aprender jogando?</p>
                {/* Nível, XP e ofensiva da criança */}
                <div className="flex justify-center gap-2 mb-6 font-body text-sm font-bold">
                  <span className="rounded-lg bg-emerald-100 text-emerald-900 px-3 py-1.5">⭐ Nível {xp.level}</span>
                  <span className="rounded-lg bg-cyan-100 text-cyan-900 px-3 py-1.5">💎 {xp.xp} XP</span>
                  <span className={`rounded-lg px-3 py-1.5 ${streak ? 'bg-orange-100 text-orange-900' : 'bg-gray-100 text-gray-600'}`}>🔥 {streak}</span>
                </div>
                {subscription && !subscription.active ? (
                  <p role="alert" className="font-body bg-amber-50 border-2 border-amber-300 rounded-lg p-3 text-gray-900">
                    {subscription.failed
                      ? '📡 Não deu para conferir a assinatura. Veja a internet e abra o app de novo.'
                      : '🔒 A assinatura do StudyBlock venceu. Peça para o seu responsável renovar na Área dos Pais.'}
                  </p>
                ) : (
                <MinecraftButton variant="gold" size="xl" fullWidth className="[@media(max-width:380px)]:text-sm [@media(max-width:380px)]:px-4" onClick={() => navigate('/adventure')}>
                  ⚔️ COMEÇAR A AVENTURA
                </MinecraftButton>
                )}
              </>
            ) : (
              <>
                <p className="font-body text-gray-700 mb-6">
                  {user ? `Olá, ${user.name}. ` : ''}Crie o login de cada criança e acompanhe o progresso.
                </p>
                <MinecraftButton variant="gold" size="xl" fullWidth onClick={() => navigate('/responsavel')}>
                  👨‍👧 ÁREA DOS PAIS
                </MinecraftButton>
                <p className="font-body text-xs text-gray-600 mt-3">
                  Para a criança salvar o progresso, saia e entre com o login dela.
                </p>
              </>
            )}

            <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
              {!isChild && (
                <>
                  <MinecraftButton variant="secondary" size="sm" onClick={() => navigate('/select-age')}>
                    🎮 Jogar como visitante
                  </MinecraftButton>
                  <MinecraftButton variant="secondary" size="sm" onClick={() => setTutorialOpen(true)}>
                    ❓ Como funciona
                  </MinecraftButton>
                </>
              )}
              <MinecraftButton variant="secondary" size="sm" onClick={handleLogout}>
                Sair
              </MinecraftButton>
            </div>
          </div>
        </MinecraftCard>
      </motion.div>

      <TutorialModal
        open={tutorialOpen}
        userName={user?.name}
        onClose={() => {
          setTutorialOpen(false);
          if (user) markTutorialSeen(user.id);
        }}
      />
    </div>
  );
}
