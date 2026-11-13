import { BlockLoader } from '../components/ui/BlockLoader';
import { SceneProvider } from '../components/activities/shared/SceneContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { LevelRewardModal, type RewardHighlight } from '../components/adventure/LevelRewardModal';
import { WorldUnlockAnimation } from '../components/adventure/WorldUnlockAnimation';
import { MobMascot } from '../components/mobs';
import { MuteButton } from '../components/ui/MuteButton';
import { VoiceButton } from '../components/ui/VoiceButton';
import { MusicButton } from '../components/ui/MusicButton';
import { BossBattle, BossDefeat, type BossEvent } from '../components/adventure/BossBattle';
import { DiamondRush } from '../components/adventure/DiamondRush';
import { playVoiceSequence } from '../lib/voice';
import { WorldBackdrop } from '../components/adventure/WorldBackdrop';
import { isBossLevel, themeForLevel, stickerForLevel } from '../data/worldThemes';
import { scoreForErrors } from '../lib/scoring';
import { gameStatsService, getDailyProgress, getDailyStreak, CHEST_XP, type AchievementDef } from '../services/gameStatsService';
import { AchievementToast } from '../components/ui/AchievementToast';
import { buildRounds, baseActivityId } from '../lib/activityParsers';
import { adventureService } from '../services/adventureService';
import { progressService } from '../services/progressService';
import { activityService } from '../services/activityService';
import { generateAdventureLevels, getWorldForLevel } from '../data/adventureWorlds';
import { Activity } from '../types';

// Activity components
import { MultipleChoiceActivity } from '../components/activities/MultipleChoiceActivity';
import { CountingActivity } from '../components/activities/CountingActivity';
import { ColorIdentificationActivity } from '../components/activities/ColorIdentificationActivity';
import { MemoryActivity } from '../components/activities/MemoryActivity';
import { MatchingActivity } from '../components/activities/MatchingActivity';
import { OrderingActivity } from '../components/activities/OrderingActivity';
import { ShapeIdentificationActivity } from '../components/activities/ShapeIdentificationActivity';
import { LetterIdentificationActivity } from '../components/activities/LetterIdentificationActivity';
import { SequenceActivity } from '../components/activities/SequenceActivity';
import { ClickCorrectActivity } from '../components/activities/ClickCorrectActivity';
import { DragDropActivity } from '../components/activities/DragDropActivity';
import { CraftingActivity } from '../components/activities/CraftingActivity';
import { MiningMathActivity } from '../components/activities/MiningMathActivity';
import { WordBuilderActivity } from '../components/activities/WordBuilderActivity';
import { ShadowMatchActivity } from '../components/activities/ShadowMatchActivity';
import { BuildPatternActivity } from '../components/activities/BuildPatternActivity';
import { MathMobsActivity } from '../components/activities/MathMobsActivity';

/** Ao ir para a próxima fase, a tela começa do zero (estado novo para cada fase). */
export function AdventureLevelPage() {
  const { levelNumber } = useParams<{ levelNumber: string }>();
  return <AdventureLevel key={levelNumber} />;
}

function AdventureLevel() {
  const navigate = useNavigate();
  const { levelNumber: levelParam } = useParams<{ levelNumber: string }>();
  const levelNumber = parseInt(levelParam || '1', 10);

  const ageGroup = localStorage.getItem('minecraft_edu_age_group') || 'maternal';
  // useMemo: antes a fase era recriada a cada render e o efeito de carregar rodava de novo
  const level = useMemo(
    () => generateAdventureLevels(ageGroup).find((l) => l.levelNumber === levelNumber) || null,
    [ageGroup, levelNumber]
  );
  const world = level ? getWorldForLevel(levelNumber) : null;

  // Uma fase pode ter mais de um desafio (activityIds); jogamos em sequência
  const [activities, setActivities] = useState<Activity[]>([]);
  const [step, setStep] = useState(0);
  const [midCelebrate, setMidCelebrate] = useState(false);
  const activity = activities[step] ?? null;
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [errors, setErrors] = useState(0);
  // Erros do desafio atual (a fase pode ter mais de um)
  const [stepErrors, setStepErrors] = useState(0);
  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([]);
  const clearAchievements = useCallback(() => setNewAchievements([]), []);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState<{
    stars: number;
    xp: number;
    worldCompleted: boolean;
    worldName: string | null;
    worldIcon: string;
    newPlayerLevel: number | null;
    highlights: RewardHighlight[];
  } | null>(null);
  // Já tinha jogado hoje ao abrir a fase? (se não, a ofensiva sobe ao terminar)
  const [playedTodayAtStart] = useState(() => getDailyProgress().playedToday);
  const [showWorldUnlock, setShowWorldUnlock] = useState(false);
  // Fase 10 de cada mundo: prova contra o chefe com perguntas das fases do mundo.
  // Acertou de primeira = ponto da criança; errou = ponto do chefe. Só passa de mundo vencendo.
  const bossLevel = isBossLevel(levelNumber);
  const boss = themeForLevel(levelNumber).boss;
  const [playerScore, setPlayerScore] = useState(0);
  const [bossScore, setBossScore] = useState(0);
  const [bossLost, setBossLost] = useState(false);
  const [bossWon, setBossWon] = useState(false);
  // De vez em quando o mascote diz "Muito bem! Próxima!" entre as perguntas
  const proximaTurn = step % 3 === 1;

  // Começo da fase (a pergunta espera a vez): boas-vindas na 1ª fase do mundo; nas outras, "Bora!"
  useEffect(() => {
    if (isBossLevel(levelNumber)) return; // o chefe se apresenta
    const world = String(Math.ceil(levelNumber / 10)).padStart(2, '0');
    playVoiceSequence([levelNumber % 10 === 1 ? `voz/mundos/mundo-${world}.mp3` : 'voz/mascote/inicio-fase.mp3']);
  }, [levelNumber]);
  const [attempt, setAttempt] = useState(0);
  const [bossEvent, setBossEvent] = useState<BossEvent | null>(null);
  // Minijogo de diamantes no meio de algumas fases (de 3 em 3, menos nas de chefe)
  const hasMinigame = !bossLevel && levelNumber % 3 === 0;
  const [minigame, setMinigame] = useState(false);
  const [minigameXP, setMinigameXP] = useState(0);

  useEffect(() => {
    if (!level) {
      setLoading(false);
      return;
    }

    const initLevel = async () => {
      try {
        // Check if level is locked
        const progress = adventureService.getLevelProgress(ageGroup);
        const levelProgress = progress[levelNumber];

        if (levelProgress && levelProgress.status === 'locked') {
          setIsLocked(true);
          setLoading(false);
          return;
        }

        // Start level
        adventureService.startLevel(levelNumber, ageGroup);

        if (isBossLevel(levelNumber)) {
          // Prova do mundo: uma pergunta de cada fase do mundo (fase 1 → 10, do mais fácil ao mais difícil)
          const first = levelNumber - 9;
          const worldLevels = generateAdventureLevels(ageGroup).filter((l) => l.levelNumber >= first && l.levelNumber <= levelNumber);
          const acts = await Promise.all(worldLevels.map((l) => activityService.getActivityById(l.activityIds[0])));
          setActivities(
            acts
              .filter((a): a is Activity => a !== null)
              .map((a) => {
                const rounds = buildRounds(a);
                return rounds[Math.floor(Math.random() * rounds.length)];
              })
          );
          setStep(0);
        } else if (level.activityIds && level.activityIds.length > 0) {
          // Get activities (async)
          const acts = await Promise.all(level.activityIds.map((id) => activityService.getActivityById(id)));
          // Cada atividade vira suas rodadas (pelo menos 5 tarefas)
          setActivities(acts.filter((a): a is Activity => a !== null).flatMap(buildRounds));
          setStep(0);
        }
      } catch (error) {
        console.error('Error initializing level:', error);
      } finally {
        setLoading(false);
      }
    };

    initLevel();
  }, [level, levelNumber, ageGroup, attempt]);

  /** Revanche contra o chefe: perguntas sorteadas de novo, placar zerado. */
  const retryBoss = useCallback(() => {
    setBossLost(false);
    setBossWon(false);
    setPlayerScore(0);
    setBossScore(0);
    setErrors(0);
    setStepErrors(0);
    setBossEvent(null);
    setStep(0);
    setAttempt((a) => a + 1);
  }, []);

  const handleCorrect = useCallback(() => {
    const unlocked = activity ? gameStatsService.recordResult({ ...activity, id: baseActivityId(activity.id) }, stepErrors) : [];
    setStepErrors(0);
    // Prova do chefe: acertou de primeira = ponto da criança
    const scoredNow = bossLevel && stepErrors === 0;
    if (scoredNow) {
      setPlayerScore((p) => p + 1);
      setBossEvent({ kind: 'hit', id: Date.now() });
    }

    // Ainda tem desafio nesta fase: comemora e passa para o próximo
    if (step < activities.length - 1) {
      setNewAchievements(unlocked);
      // No meio da fase: minijogo (depois volta para a próxima pergunta)
      if (hasMinigame && step === Math.floor(activities.length / 2) - 1) {
        setTimeout(() => setMinigame(true), 900);
        return;
      }
      setMidCelebrate(true);
      setTimeout(() => {
        setMidCelebrate(false);
        setStep((s) => s + 1);
      }, 1400);
      return;
    }

    // Fim da prova: só conclui a fase (e passa de mundo) se a criança fez mais pontos que o chefe
    const finalPlayer = playerScore + (scoredNow ? 1 : 0);
    if (bossLevel && finalPlayer <= bossScore) {
      setTimeout(() => setBossLost(true), 1300);
      return;
    }

    // Estrelas conforme os erros: 0 = 3, 1 = 2, 2+ = 1
    const levelBefore = progressService.getLocalStats().level;
    const before = adventureService.getLevelProgress(ageGroup)[levelNumber];
    const wasCompleted = before?.status === 'completed';
    const result = adventureService.completeLevel(levelNumber, scoreForErrors(errors), ageGroup);
    const levelAfter = progressService.getLocalStats().level;
    const worldUnlocked = result.worldCompleted ? gameStatsService.recordWorldCompleted() : [];
    // Troféus de fases e conquista de nível dependem da fase recém-concluída e do XP somado
    const afterLevel = gameStatsService.checkNewAchievements();
    const earned = [...unlocked, ...worldUnlocked, ...afterLevel].filter(
      (a, i, all) => all.findIndex((b) => b.id === a.id) === i
    );
    const daily = gameStatsService.recordLevelDone();

    // O que aparece animado no modal, nesta ordem
    const highlights: RewardHighlight[] = [];
    if (wasCompleted && result.stars > (before?.stars ?? 0)) {
      highlights.push({ id: 'recorde', icon: '🏅', label: 'Novo recorde!', title: `Agora com ${result.stars} estrelas`, text: `Antes: ${before?.stars ?? 0}` });
    }
    if (!wasCompleted) {
      const sticker = stickerForLevel(levelNumber);
      highlights.push({ id: 'figurinha', icon: sticker.icon, label: 'Nova figurinha!', title: sticker.name, text: 'Veja no seu álbum' });
    }
    if (!playedTodayAtStart) {
      const streak = getDailyStreak();
      highlights.push({ id: 'ofensiva', icon: '🔥', label: 'Ofensiva!', title: `${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'}`, text: 'Volte amanhã para aumentar' });
    }
    if (bossLevel) {
      highlights.unshift({ id: 'chefe', icon: '⚔️', label: 'Chefe derrotado!', title: `${boss.name}: ${finalPlayer} × ${bossScore}`, text: 'Você passou na prova do mundo!' });
    }
    if (minigameXP > 0) {
      highlights.push({ id: 'minijogo', icon: '💎', label: 'Minijogo', title: `+${minigameXP} XP de diamantes` });
    }
    if (daily.chestNow) {
      highlights.push({ id: 'bau', icon: '🎁', label: 'Meta do dia cumprida!', title: `Baú aberto: +${CHEST_XP} XP`, kind: 'chest' });
    }
    highlights.push(
      ...earned.map((a) => ({
        id: a.id,
        icon: a.icon,
        label: a.id.startsWith('trofeu') ? 'Troféu ganho!' : 'Conquista desbloqueada!',
        title: a.name,
        text: a.description,
      }))
    );

    // Find next world info for unlock animation
    const nextWorldOrder = Math.ceil(levelNumber / 10) + 1;
    const nextWorld = nextWorldOrder <= 10
      ? getWorldForLevel((nextWorldOrder - 1) * 10 + 1)
      : null;

    setRewardData({
      stars: result.stars,
      xp: result.xpGained,
      worldCompleted: result.worldCompleted,
      worldName: result.newWorldUnlocked || (nextWorld ? nextWorld.name : null),
      worldIcon: nextWorld ? nextWorld.icon : '🏆',
      newPlayerLevel: levelAfter > levelBefore ? levelAfter : null,
      highlights,
    });

    // Chefe: ele cai e fala a derrota antes da comemoração
    if (bossLevel) {
      setBossWon(true);
      setTimeout(() => setShowRewardModal(true), 3200);
    }
    else setShowRewardModal(true);
  }, [bossLevel, boss.name, playerScore, bossScore, hasMinigame, minigameXP, playedTodayAtStart, levelNumber, ageGroup, errors, step, activities.length, activity, stepErrors]);

  const handleWrong = useCallback(() => {
    setErrors((e) => e + 1);
    setStepErrors((e) => e + 1);
    gameStatsService.recordWrong();
    // Prova do chefe: o 1º erro na pergunta é ponto do chefe
    if (bossLevel && stepErrors === 0) {
      setBossScore((b) => b + 1);
      setBossEvent({ kind: 'laugh', id: Date.now() });
    }
    setShowWrongFeedback(true);
    setTimeout(() => {
      setShowWrongFeedback(false);
    }, 2500);
  }, [bossLevel, stepErrors]);

  const handleMinigameFinish = useCallback((collected: number) => {
    const xp = Math.min(collected, 10);
    if (xp > 0) progressService.addXP(xp);
    setMinigameXP(xp);
    setMinigame(false);
    setStep((st) => st + 1);
  }, []);

  const nextLevel = levelNumber < 100 ? levelNumber + 1 : null;
  const goNext = useCallback(() => {
    navigate(nextLevel ? `/adventure/${nextLevel}` : '/adventure');
  }, [navigate, nextLevel]);

  // Próxima fase: se fechou o mundo, mostra antes a animação do mundo novo
  const handleRewardNext = useCallback(() => {
    if (rewardData?.worldCompleted && rewardData.worldName) {
      setShowRewardModal(false);
      setShowWorldUnlock(true);
    } else {
      goNext();
    }
  }, [rewardData, goNext]);

  const handleWorldUnlockComplete = useCallback(() => {
    setShowWorldUnlock(false);
    goNext();
  }, [goNext]);

  // Render activity based on type
  const renderActivity = () => {
    if (!activity) {
      return (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🏗️</p>
          <p className="font-body text-gray-300 text-lg">
            Atividade não disponível.
          </p>
          <MinecraftButton variant="secondary" onClick={() => navigate('/adventure')} className="mt-4">
            Voltar ao Mapa
          </MinecraftButton>
        </div>
      );
    }

    const commonProps = {
      activity,
      onCorrect: handleCorrect,
      onWrong: handleWrong,
    };

    switch (activity.activity_type) {
      case 'multiple-choice':
        return <MultipleChoiceActivity {...commonProps} />;
      case 'counting':
        return <CountingActivity {...commonProps} />;
      case 'color-identification':
        return <ColorIdentificationActivity {...commonProps} />;
      case 'memory':
        return <MemoryActivity {...commonProps} />;
      case 'matching':
        return <MatchingActivity {...commonProps} />;
      case 'ordering':
        return <OrderingActivity {...commonProps} />;
      case 'shape-identification':
        return <ShapeIdentificationActivity {...commonProps} />;
      case 'letter-identification':
        return <LetterIdentificationActivity {...commonProps} />;
      case 'sequence':
        return <SequenceActivity {...commonProps} />;
      case 'click-correct':
        return <ClickCorrectActivity {...commonProps} />;
      case 'drag-drop':
        return <DragDropActivity {...commonProps} />;
      case 'crafting':
        return <CraftingActivity {...commonProps} />;
      case 'mining-math':
        return <MiningMathActivity {...commonProps} />;
      case 'word-builder':
        return <WordBuilderActivity {...commonProps} />;
      case 'shadow-match':
        return <ShadowMatchActivity {...commonProps} />;
      case 'build-pattern':
        return <BuildPatternActivity {...commonProps} />;
      case 'math-mobs':
        return <MathMobsActivity {...commonProps} />;
      default:
        return <MultipleChoiceActivity {...commonProps} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <BlockLoader label="Preparando a fase…" dark />
      </div>
    );
  }

  // Not found state
  if (!level) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center gap-4 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-4xl mb-4">❓</p>
          <h2 className="text-xl font-bold text-white mb-2">Fase não encontrada</h2>
          <p className="text-gray-400 mb-6">Esta fase não existe no mapa da aventura.</p>
          <MinecraftButton variant="primary" onClick={() => navigate('/adventure')}>
            Voltar ao Mapa
          </MinecraftButton>
        </motion.div>
      </div>
    );
  }

  // Locked state
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center gap-4 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-white mb-2">Fase Bloqueada</h2>
          <p className="text-gray-400 mb-6">
            Complete as fases anteriores para desbloquear esta fase.
          </p>
          <MinecraftButton variant="secondary" onClick={() => navigate('/adventure')}>
            Voltar ao Mapa
          </MinecraftButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-0 min-h-screen flex flex-col">
      {/* Cenário do mundo (cada mundo tem o seu) */}
      <WorldBackdrop theme={themeForLevel(levelNumber)} />
      {/* Topo: sair, uma barra de progresso da fase e os botões de som */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-minecraft-dark-green/90 backdrop-blur-sm px-3 py-2 sticky top-0 z-30"
      >
        <div className="max-w-5xl mx-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/adventure')}
            aria-label="Sair da fase e voltar ao mapa"
            title="Sair"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-md bg-black/25 text-white text-xl hover:bg-black/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-gold"
          >
            <span aria-hidden="true">✕</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-minecraft text-[9px] sm:text-[10px] text-white/90 truncate mb-1">
              {world?.icon} Fase {levelNumber} · {level.name}
            </p>
            <div
              role="progressbar"
              aria-label={`Pergunta ${Math.min(step + 1, Math.max(activities.length, 1))} de ${Math.max(activities.length, 1)}`}
              aria-valuemin={0}
              aria-valuemax={Math.max(activities.length, 1)}
              aria-valuenow={step}
              className="h-4 rounded-full bg-black/30 overflow-hidden border-2 border-black/30"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-minecraft-emerald to-lime-300"
                initial={false}
                animate={{ width: `${(Math.min(step + (showRewardModal ? 1 : 0), activities.length) / Math.max(activities.length, 1)) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <MusicButton />
            <VoiceButton />
            <MuteButton />
          </div>
        </div>
      </motion.div>

      {/* Activity Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl lg:max-w-5xl"
        >
          {bossLevel && activities.length > 0 && (
            <BossBattle
              boss={boss}
              playerScore={playerScore}
              bossScore={bossScore}
              question={step + 1}
              total={activities.length}
              event={bossEvent}
              defeated={bossWon}
            />
          )}
          <SceneProvider theme={themeForLevel(levelNumber)}>
            {/* Troca de pergunta: a cena nova desliza para dentro */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activity?.id ?? 'none'}
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -80, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderActivity()}
              </motion.div>
            </AnimatePresence>
          </SceneProvider>
        </motion.div>
      </div>

      {minigame && <DiamondRush onFinish={handleMinigameFinish} />}
      {bossLost && (
        <BossDefeat boss={boss} playerScore={playerScore} bossScore={bossScore} onRetry={retryBoss} onMap={() => navigate('/adventure')} />
      )}

      {/* Mascote: comemora no acerto, fica triste no erro */}
      <MobMascot
        mood={showRewardModal || midCelebrate ? 'celebrate' : showWrongFeedback ? 'sad' : 'idle'}
        say={midCelebrate && proximaTurn ? 'Muito bem! Próxima!' : undefined}
        silent={showRewardModal}
      />

      <AchievementToast achievements={newAchievements} onDone={clearAchievements} />

      {/* Entre um desafio e outro da mesma fase */}
      <AnimatePresence>
        {midCelebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            className="fixed inset-x-0 top-1/3 z-40 flex justify-center pointer-events-none"
          >
            <div className="bg-minecraft-gold text-gray-900 font-minecraft text-sm sm:text-base px-6 py-4 rounded-lg pixel-border shadow-xl">
              Muito bem! Próxima! ⛏️
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Reward Modal */}
      <LevelRewardModal
        show={showRewardModal}
        levelNumber={levelNumber}
        stars={rewardData?.stars || 3}
        xpGained={rewardData?.xp || level.xpReward}
        worldCompleted={rewardData?.worldCompleted || false}
        newPlayerLevel={rewardData?.newPlayerLevel}
        highlights={rewardData?.highlights}
        nextLevel={nextLevel}
        onNext={handleRewardNext}
        onMap={() => navigate('/adventure')}
      />

      {/* World Unlock Animation */}
      <WorldUnlockAnimation
        show={showWorldUnlock}
        worldName={rewardData?.worldName || ''}
        worldIcon={rewardData?.worldIcon || '🏆'}
        onComplete={handleWorldUnlockComplete}
      />
    </div>
  );
}
