import { themeForCategory } from '../data/categoryScenes';
import { SceneProvider } from '../components/activities/shared/SceneContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Activity } from '../types';
import { activityService } from '../services/activityService';
import { progressService } from '../services/progressService';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { RewardAnimation } from '../components/ui/RewardAnimation';
import { ArrowLeft } from 'lucide-react';
import { MobMascot } from '../components/mobs';
import { MuteButton } from '../components/ui/MuteButton';
import { VoiceButton } from '../components/ui/VoiceButton';
import { MusicButton } from '../components/ui/MusicButton';
import { ActivityProgress } from '../components/ui/ActivityProgress';
import { starsForErrors, scoreForErrors } from '../lib/scoring';
import { gameStatsService, getAdaptiveLevel, type AchievementDef } from '../services/gameStatsService';
import { AchievementToast } from '../components/ui/AchievementToast';
import { buildRounds, baseActivityId } from '../lib/activityParsers';
import { AgeGroup } from '../types';

// Activity type components
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
import { ClockActivity } from '../components/activities/ClockActivity';
import { ReadingActivity } from '../components/activities/ReadingActivity';

export function ActivityPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [position, setPosition] = useState<{ current: number; total: number } | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([]);
  // Rodadas: a atividade tem pelo menos 5 tarefas (a 1ª é a pergunta original)
  const [rounds, setRounds] = useState<Activity[]>([]);
  const [step, setStep] = useState(0);
  const [roundErrors, setRoundErrors] = useState(0);
  const [midCelebrate, setMidCelebrate] = useState(false);
  const current = rounds[step] ?? null;
  const clearAchievements = useCallback(() => setNewAchievements([]), []);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      try {
        const data = await activityService.getActivityById(id);
        setActivity(data);
        setRounds(data ? buildRounds(data, getAdaptiveLevel()) : []);
        setStep(0);
        setRoundErrors(0);
        setAttempts(0);
        setIsCorrect(null);

        // Posição desta atividade na lista do tema (ex.: "Pergunta 3 de 8")
        if (data) {
          const ageGroup = (localStorage.getItem('minecraft_edu_age_group') || data.age_group) as AgeGroup;
          const list = await activityService.getActivities(ageGroup, data.category);
          const index = list.findIndex((a) => a.id === data.id);
          setPosition(index >= 0 ? { current: index + 1, total: list.length } : null);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id]);

  const handleCorrectAnswer = useCallback(async () => {
    if (!activity || !current) return;
    setIsCorrect(true);
    // Resultado de cada tarefa (painel do professor), dias seguidos e conquistas
    setNewAchievements(gameStatsService.recordResult({ ...current, id: baseActivityId(current.id) }, roundErrors));
    setRoundErrors(0);

    // Ainda tem rodada: comemora e vai para a próxima
    if (step < rounds.length - 1) {
      setMidCelebrate(true);
      setTimeout(() => {
        setMidCelebrate(false);
        setIsCorrect(null);
        setStep((s) => s + 1);
      }, 1300);
      return;
    }

    setShowReward(true);
    try {
      // Pontuação pelos erros da atividade toda (o bônus de "primeira tentativa" só vale sem erros)
      await progressService.completeActivity(activity.id, scoreForErrors(attempts));
      // A conquista de nível depende do XP que acabou de ser somado
      const unlockedNow = gameStatsService.checkNewAchievements();
      if (unlockedNow.length > 0) setNewAchievements((prev) => [...prev, ...unlockedNow]);
    } catch (error) {
      console.error('Error saving activity progress:', error);
    }
  }, [activity, current, roundErrors, attempts, step, rounds.length]);

  const handleWrongAnswer = useCallback(() => {
    setIsCorrect(false);
    setAttempts(prev => prev + 1);
    setRoundErrors(prev => prev + 1);
    gameStatsService.recordWrong();

    // Reset after animation
    setTimeout(() => {
      setIsCorrect(null);
    }, 2000);
  }, []);

  const handleRewardComplete = () => {
    setShowReward(false);
    navigate(-1);
  };

  const renderActivity = () => {
    if (!current) return null;

    const commonProps = {
      activity: current,
      onCorrect: handleCorrectAnswer,
      onWrong: handleWrongAnswer,
    };

    switch (current.activity_type) {
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
      case 'clock':
        return <ClockActivity {...commonProps} />;
      case 'reading':
        return <ReadingActivity {...commonProps} />;
      default:
        return <MultipleChoiceActivity {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-minecraft-sky to-blue-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-5xl"
        >
          ⛏️
        </motion.div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-minecraft-sky to-blue-100 flex flex-col items-center justify-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="font-body text-gray-600 mb-4">Atividade não encontrada</p>
        <MinecraftButton onClick={() => navigate('/world')}>Voltar ao Mapa</MinecraftButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-minecraft-sky to-blue-100">
      {/* Top Bar */}
      <div className="bg-minecraft-dark-green/90 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <MinecraftButton variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
          </MinecraftButton>
          <div className="text-center">
            <h2 className="font-minecraft text-[10px] sm:text-xs text-white">
              {activity.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-minecraft text-[10px] text-minecraft-gold">
              💎 {activity.points} XP
            </span>
            <MusicButton />
            <VoiceButton />
            <MuteButton />
          </div>
        </div>
      </div>

      {/* Activity Content */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {rounds.length > 1 && <ActivityProgress current={step + 1} total={rounds.length} />}
        {position && (
          <p className="text-center font-body text-xs text-gray-700 -mt-2 mb-3">
            Atividade {position.current} de {position.total} deste tema
          </p>
        )}

        {/* Feedback Messages */}
        <AnimatePresence>
          {isCorrect === false && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-4 bg-orange-100 border-2 border-orange-300 rounded-lg p-3 text-center pixel-border"
            >
              <p className="font-body font-bold text-orange-700">
                Quase! Tente novamente! 💪
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Render Activity */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <SceneProvider theme={themeForCategory(activity.category)}>
            {/* Troca de pergunta: a cena nova desliza para dentro */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current?.id ?? activity.id}
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

        {/* Attempts counter */}
        {attempts > 0 && (
          <div className="text-center mt-4">
            <p className="font-body text-sm text-gray-500">
              Tentativas: {attempts}
            </p>
          </div>
        )}
      </div>

      {/* Mascote: comemora no acerto, fica triste no erro */}
      <MobMascot mood={isCorrect === true ? 'celebrate' : isCorrect === false ? 'sad' : 'idle'} />

      <AchievementToast achievements={newAchievements} onDone={clearAchievements} />

      {/* Entre uma rodada e outra */}
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

      {/* Reward Animation */}
      <RewardAnimation
        show={showReward}
        xpGained={activity.points}
        stars={starsForErrors(attempts)}
        message="Muito bem! Você conseguiu! 🎉"
        onComplete={handleRewardComplete}
      />
    </div>
  );
}
