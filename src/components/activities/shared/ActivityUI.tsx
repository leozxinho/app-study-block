import { useEffect, useId, type ReactNode } from 'react';
import { isVoiceSupported, readsAloudByDefault, speak, stopSpeaking } from '../../../lib/voice';
import { Mob } from '../../mobs';
import { useGameStats } from '../../../services/gameStatsService';
import { useSceneTheme } from './sceneTheme';
import { ItemArt } from './ItemArt';
import { AnimatePresence, motion } from 'framer-motion';
import type { FeedbackStage } from './useAnswerFeedback';

interface ActivityCardProps {
  /** Ícone antigo do tipo de atividade (não aparece mais: quem pergunta é o personagem) */
  icon?: string;
  question: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

/**
 * Moldura padrão das atividades: em cima, o cenário do mundo com o personagem da criança
 * fazendo a pergunta num balão (com 🔊 para ouvir); embaixo, a atividade.
 */
export function ActivityCard({ question, subtitle, children }: ActivityCardProps) {
  const id = useId();
  const theme = useSceneTheme();
  const { skin } = useGameStats();
  // Quem ainda não lê ouve a pergunta assim que ela aparece
  useEffect(() => {
    if (!readsAloudByDefault()) return;
    const t = setTimeout(() => speak(question), 350);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [question]);
  return (
    <section
      aria-labelledby={id}
      className="bg-white rounded-xl pixel-border shadow-lg overflow-hidden lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:min-h-[420px]"
    >
      {/* Tela larga: a cena vira a coluna da esquerda, as respostas a da direita */}
      <header className={`relative bg-gradient-to-b ${theme.sky} px-3 sm:px-5 pt-4 pb-7 overflow-hidden lg:flex lg:flex-col lg:justify-end lg:pb-10`}>
        {/* enfeites do mundo */}
        <span aria-hidden="true" className="absolute right-3 top-2 opacity-50 scene-float">
          <ItemArt emoji={theme.decor[0]} size={28} />
        </span>
        <span aria-hidden="true" className="absolute right-14 bottom-4 opacity-40 scene-float" style={{ animationDelay: '1.2s' }}>
          <ItemArt emoji={theme.decor[1]} size={22} />
        </span>
        <div className="relative flex items-end gap-2 sm:gap-3">
          <div className="shrink-0 -mb-2 lg:origin-bottom-left lg:scale-150 lg:mr-6">
            <Mob type={skin.character} skin={skin} size={48} animation="idle" title="Você" />
          </div>
          {/* balão de fala com a pergunta */}
          <div className="relative flex-1 min-w-0 bg-white rounded-xl border-2 border-gray-800 px-3 py-2 shadow-md">
            <span aria-hidden="true" className="absolute -left-2 bottom-3 w-3 h-3 bg-white border-l-2 border-b-2 border-gray-800 rotate-45" />
            <div className="flex items-center justify-between gap-2">
              <h2 id={id} className="font-body text-base sm:text-xl font-bold text-gray-900">
                {question}
              </h2>
              {isVoiceSupported() && (
                <button
                  type="button"
                  onClick={() => speak(question, { force: true })}
                  aria-label="Ouvir a pergunta"
                  title="Ouvir a pergunta"
                  className="shrink-0 w-10 h-10 rounded-full bg-sky-100 text-xl hover:bg-sky-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
                >
                  <span aria-hidden="true">🔊</span>
                </button>
              )}
            </div>
            {subtitle && <p className="font-body text-sm text-gray-700 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {/* chão do mundo */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-4" style={{ background: theme.ground }} />
      </header>
      <div className="p-4 sm:p-6 lg:p-8 lg:flex lg:flex-col lg:justify-center">{children}</div>
    </section>
  );
}

interface AnswerFeedbackProps {
  stage: FeedbackStage;
  hint: ReactNode;
  answer?: ReactNode;
  /** Texto depois da resposta. Padrão: "Toque nela!" */
  revealAction?: string;
  /** Substitui a frase inteira de "resposta certa" (ex.: memória). */
  revealText?: ReactNode;
}

/** Dica no 1º erro e resposta certa a partir do 2º. */
export function AnswerFeedback({
  stage,
  hint,
  answer,
  revealAction = 'Toque nela!',
  revealText,
}: AnswerFeedbackProps) {
  return (
    <div role="status" aria-live="polite" className="mt-4">
      <AnimatePresence mode="wait">
        {stage === 'hint' && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-amber-50 border-2 border-amber-500 text-amber-900 rounded-lg px-4 py-3 font-body font-bold text-center"
          >
            💡 Dica: {hint}
          </motion.p>
        )}
        {stage === 'reveal' && (
          <motion.p
            key="reveal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-sky-50 border-2 border-sky-600 text-sky-900 rounded-lg px-4 py-3 font-body font-bold text-center"
          >
            👉{' '}
            {revealText ?? (
              <>
                A resposta certa é <span className="underline">{answer}</span>. {revealAction}
              </>
            )}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Estrelinha que aparece na resposta certa. */
export function CorrectBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.span
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      className="absolute -top-3 -right-3 text-3xl pointer-events-none"
      aria-hidden="true"
    >
      ⭐
    </motion.span>
  );
}
