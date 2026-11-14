import { playVoiceSequence, stopSpeaking } from '../../lib/voice';
import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { MinecraftButton } from '../ui/MinecraftButton';
import { Mob } from '../mobs';
import { TUTORIAL_VIDEO_URL, videoEmbed } from '../../lib/tutorial';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

interface Step {
  title: string;
  text: string;
  visual: ReactNode;
}

const Chip = ({ children, tone = 'bg-white' }: { children: ReactNode; tone?: string }) => (
  <span className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md pixel-border font-body font-bold text-sm text-gray-900 ${tone}`}>
    {children}
  </span>
);

function VideoOrIntro() {
  const video = videoEmbed(TUTORIAL_VIDEO_URL);
  if (video?.kind === 'youtube') {
    return (
      <div className="w-full aspect-video rounded-md overflow-hidden pixel-border bg-black">
        <iframe
          src={video.src}
          title="Vídeo: como funciona o StudyBlock"
          className="w-full h-full"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (video?.kind === 'file') {
    return <video src={video.src} controls className="w-full rounded-md pixel-border bg-black" aria-label="Vídeo: como funciona o StudyBlock" />;
  }
  return (
    <div className="flex items-end justify-center gap-4 py-2">
      <Mob type="steve" size={64} animation="celebrate" />
      <Mob type="pig" size={44} animation="walk" />
      <Mob type="alex" size={64} animation="idle" />
    </div>
  );
}

const STEPS: Step[] = [
  {
    title: 'Bem-vindo ao StudyBlock!',
    text: 'Uma plataforma de atividades educativas em um mundo de blocos. Veja em 1 minuto como a criança joga e como você acompanha.',
    visual: <VideoOrIntro />,
  },
  {
    title: '1. Crie a conta da criança',
    text: 'Na Área dos Pais, cadastre cada criança com nome, idade, login e senha. A criança entra com o login dela e as atividades se ajustam à idade.',
    visual: (
      <div className="grid grid-cols-2 gap-2">
        <Chip tone="bg-pink-100">🍼 Berçário</Chip>
        <Chip tone="bg-orange-100">🧸 Maternal</Chip>
        <Chip tone="bg-blue-100">🎨 Pré-Escola I</Chip>
        <Chip tone="bg-purple-100">📚 Pré-Escola II</Chip>
      </div>
    ),
  },
  {
    title: '2. A aventura',
    text: '100 fases em 10 mundos. Cada fase tem pelo menos 5 perguntas, e a criança ganha até 3 estrelas conforme acerta de primeira.',
    visual: (
      <div className="flex items-center justify-center gap-2">
        {['✅', '✅', '▶', '🔒'].map((s, i) => (
          <span key={i} className="relative">
            {i === 2 && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2">
                <Mob type="steve" size={34} animation="idle" />
              </span>
            )}
            <span className={`w-12 h-12 rounded-lg pixel-border flex items-center justify-center text-xl ${i < 2 ? 'bg-minecraft-emerald' : i === 2 ? 'bg-minecraft-gold' : 'bg-gray-400'}`}>{s}</span>
          </span>
        ))}
        <span className="ml-2 text-2xl" aria-hidden="true">⭐⭐⭐</span>
      </div>
    ),
  },
  {
    title: '3. Ajuda na hora certa',
    text: 'Errou? Aparece uma dica. Errou de novo? A resposta certa brilha. O mascote comemora os acertos e anima nos erros.',
    visual: (
      <div className="space-y-2">
        <p className="bg-amber-50 border-2 border-amber-500 text-amber-900 rounded-lg px-3 py-2 font-body font-bold text-sm">💡 Dica: conte os porcos de novo!</p>
        <p className="bg-sky-50 border-2 border-sky-600 text-sky-900 rounded-lg px-3 py-2 font-body font-bold text-sm">👉 A resposta certa é 5. Toque nela!</p>
        <div className="flex justify-center gap-6">
          <Mob type="steve" size={44} animation="sad" />
          <Mob type="steve" size={44} animation="celebrate" />
        </div>
      </div>
    ),
  },
  {
    title: '4. Recompensas',
    text: 'Cada atividade dá XP. Com XP a criança sobe de nível, desbloqueia conquistas e compra roupas e chapéus para o personagem na loja.',
    visual: (
      <div className="flex items-end justify-center gap-4">
        <Chip tone="bg-cyan-100">💎 +20 XP</Chip>
        <Chip tone="bg-amber-100">🏆 Conquista</Chip>
        <Mob type="steve" size={56} animation="idle" skin={{ character: 'luna', shirt: 'original', pants: 'original', hat: 'coroa', hero: 'estelar' }} />
      </div>
    ),
  },
  {
    title: '5. Acompanhe o progresso',
    text: 'Na Área dos Pais você cria o login de cada criança e vê o progresso dela: fases, estrelas, dias seguidos jogando e resultados por tipo de atividade. O som pode ser desligado no topo das atividades.',
    visual: (
      <div className="flex items-end justify-center gap-2 h-24" aria-hidden="true">
        {[40, 70, 55, 90, 65].map((h, i) => (
          <span key={i} className="w-8 rounded-t bg-minecraft-emerald" style={{ height: `${h}%` }} />
        ))}
        <span className="text-3xl ml-2">📋</span>
      </div>
    ),
  },
];

/** Tutorial visual (aparece na 1ª entrada; dá para abrir de novo na tela /inicio). */
export function TutorialModal({ open, onClose, userName }: TutorialModalProps) {
  const [step, setStep] = useState(0);

  // Narração para os pais (voz/pais): boas-vindas + o texto de cada tela
  useEffect(() => {
    if (!open) return;
    playVoiceSequence(step === 0 ? ['voz/pais/boas-vindas.mp3', 'voz/pais/tutorial-0.mp3'] : [`voz/pais/tutorial-${step}.mp3`]);
    return () => stopSpeaking();
  }, [open, step]);
  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  const close = () => {
    onClose();
    setStep(0);
  };

  return (
    <Modal open={open} onClose={close} title="Tutorial: como funciona o StudyBlock" maxWidth="max-w-lg">
      <div className="p-6 sm:p-8">
        {step === 0 && userName && <p className="font-body text-sm text-gray-700 mb-1">Olá, {userName}!</p>}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <h3 className="font-minecraft text-base sm:text-lg text-gray-900 mb-4 pr-8">{s.title}</h3>
            <div className="bg-gradient-to-b from-sky-100 to-green-100 rounded-lg pixel-border p-4 mb-4 min-h-[140px] flex items-center justify-center">
              <div className="w-full">{s.visual}</div>
            </div>
            <p className="font-body text-base text-gray-800">{s.text}</p>
          </motion.div>
        </AnimatePresence>

        {/* Passos */}
        <div className="flex justify-center gap-2 my-5" role="tablist" aria-label="Passos do tutorial">
          {STEPS.map((x, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === step}
              aria-label={`Passo ${i + 1}: ${x.title}`}
              onClick={() => setStep(i)}
              className={`w-3 h-3 rounded-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-lapis ${i === step ? 'bg-minecraft-dark-green' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          {step > 0 ? (
            <MinecraftButton variant="secondary" size="sm" className="whitespace-nowrap min-h-[44px]" onClick={() => setStep(step - 1)}>← Voltar</MinecraftButton>
          ) : (
            <button type="button" onClick={close} className="font-body text-sm text-gray-700 underline min-h-[44px] px-2">
              Pular tutorial
            </button>
          )}
          <MinecraftButton variant={last ? 'gold' : 'primary'} size="md" className="whitespace-nowrap" onClick={() => (last ? close() : setStep(step + 1))}>
            {last ? '⚔️ Vamos começar!' : 'Próximo →'}
          </MinecraftButton>
        </div>
      </div>
    </Modal>
  );
}
