import { playJingle } from '../../lib/audio/music';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useReduceMotion } from '../../lib/motion';
import {motion} from 'framer-motion';
import { Mob } from '../mobs';
import { getMobPixelSize } from '../mobs/mobSprites';
import { playSound, unlockAudio } from '../../lib/sounds';
import { MinecraftButton } from '../ui/MinecraftButton';

interface IntroSplashProps {
  onDone: () => void;
}

const WALK_MS = 2600;
const PAUSE_MS = 500;
// a animação "fuse" do creeper dura 2,2s e ele some aos 74%: é aí que explode
const FUSE_MS = 2200;
const BOOM_AT = Math.round(FUSE_MS * 0.72);
const FADE_MS = 700;

// ready = tela "Toque para jogar" (o toque libera o som da explosão)
type Phase = 'ready' | 'walk' | 'stop' | 'fuse' | 'boom' | 'fade';

/**
 * Abertura: "Toque para jogar" → creeper entra andando, para no meio, incha, explode e revela a tela inicial.
 * O toque inicial é o que permite tocar som (os navegadores bloqueiam áudio antes de uma interação).
 */
export function IntroSplash({ onDone }: IntroSplashProps) {
  // Movimento reduzido: creeper já parado no meio, pisca e some num clarão (sem andar, tremer ou voar blocos)
  const reduce = useReduceMotion();
  const [phase, setPhase] = useState<Phase>('ready');
  const [started, setStarted] = useState(false);
  const doneRef = useRef(false);
  const playRef = useRef<HTMLButtonElement | null>(null);
  // Creeper grande: ~1/3 da altura da tela (entre 170 e 300 de referência)
  const creeperSize = useMemo(() => Math.round(Math.min(Math.max(window.innerHeight * 0.42, 170), 300)), []);
  const { width, height } = getMobPixelSize('creeper', creeperSize);
  // Centro da explosão = meio do creeper (chão tem 112px)
  const originBottom = 112 + height / 2;
  // Distância até o canto mais longe da tela: a explosão cobre o site inteiro
  const reach = useMemo(() => Math.hypot(window.innerWidth, window.innerHeight), []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  // Toque/clique/Enter: libera o som (tem que ser aqui, no gesto) e começa a cena
  const start = useCallback(() => {
    if (started) return;
    unlockAudio();
    setStarted(true);
    setPhase(reduce ? 'stop' : 'walk');
  }, [started, reduce]);

  useEffect(() => {
    playRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [finish]);

  useEffect(() => {
    if (!started) return;
    const t: number[] = [];
    const at = (ms: number, fn: () => void) => t.push(window.setTimeout(fn, ms));
    if (reduce) {
      at(900, () => {
        setPhase('boom');
        playSound('explode');
      });
      at(1500, () => setPhase('fade'));
      at(1500 + FADE_MS, finish);
      return () => t.forEach(clearTimeout);
    }
    playJingle('abertura-creeper');
    at(WALK_MS, () => setPhase('stop'));
    at(WALK_MS + PAUSE_MS, () => {
      setPhase('fuse');
      playSound('hiss');
    });
    at(WALK_MS + PAUSE_MS + BOOM_AT, () => {
      setPhase('boom');
      playSound('explode');
    });
    at(WALK_MS + PAUSE_MS + BOOM_AT + 1300, () => setPhase('fade'));
    at(WALK_MS + PAUSE_MS + BOOM_AT + 1300 + FADE_MS, finish);
    return () => t.forEach(clearTimeout);
  }, [started, finish, reduce]);

  // Pedaços de bloco voando até as bordas da tela
  const debris = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const angle = (i / 72) * Math.PI * 2 + Math.random() * 0.15;
        const dist = reach * (0.45 + Math.random() * 0.65);
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 14 + Math.round(Math.random() * 28),
          color: ['#4caf3c', '#3d8f2f', '#73d05f', '#7f7f7f', '#5a5a5a', '#2b2b2b', '#9B7653'][i % 7],
          delay: Math.random() * 0.12,
        };
      }),
    [reach]
  );
  // Nuvens de fumaça grandes espalhadas pela tela
  const smoke = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const dist = reach * (0.12 + Math.random() * 0.4);
        return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, size: 70 + Math.round(Math.random() * 90), delay: Math.random() * 0.2 };
      }),
    [reach]
  );

  const exploded = phase === 'boom' || phase === 'fade';

  return (
    <motion.div
      className={`fixed inset-0 z-[90] overflow-hidden cursor-pointer ${phase === 'boom' ? 'intro-shake' : ''}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'fade' ? 0 : 1 }}
      transition={{ duration: FADE_MS / 1000 }}
      onClick={phase === 'ready' ? start : finish}
      role="dialog"
      aria-label="Abertura animada do MineLearn"
    >
      {/* Cenário */}
      <div className="absolute inset-0 bg-gradient-to-b from-minecraft-sky via-blue-300 to-blue-200" />
      <div className="absolute bottom-0 left-0 right-0 h-28">
        <div className="h-4 bg-minecraft-green w-full" />
        <div className="h-24 bg-minecraft-dirt w-full block-pattern" />
      </div>
      {/* Cratera depois da explosão */}
      {exploded && (
        <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-[70vw] max-w-[520px] h-12 bg-minecraft-dark-brown rounded-[50%] opacity-80" aria-hidden="true" />
      )}

      {/* Tela "Toque para jogar" */}
      {phase === 'ready' && (
        <>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4 pb-28 text-center">
            <h1 className="font-minecraft text-3xl sm:text-5xl text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]">MineLearn</h1>
            <p className="font-minecraft text-xs sm:text-sm text-minecraft-gold drop-shadow-[2px_2px_0px_rgba(0,0,0,0.6)]">Aprenda jogando!</p>
            <div className="cta-pulse rounded-md">
              <MinecraftButton variant="gold" size="lg" onClick={start}>
                <span ref={(el) => { playRef.current = el?.closest('button') ?? null; }}>▶ Toque para jogar</span>
              </MinecraftButton>
            </div>
          </div>
          {/* Creeper espiando no canto */}
          <div className="absolute bottom-28 left-4" aria-hidden="true">
            <Mob type="creeper" size={Math.round(creeperSize * 0.6)} animation="idle" />
          </div>
        </>
      )}

      {/* Creeper andando da esquerda até o meio */}
      {!exploded && phase !== 'ready' && (
        <motion.div
          className="absolute bottom-28"
          style={{ left: `calc(50% - ${width / 2}px)` }}
          initial={{ x: '-60vw' }}
          animate={{ x: 0 }}
          transition={{ duration: WALK_MS / 1000, ease: 'linear' }}
        >
          <Mob
            type="creeper"
            size={creeperSize}
            animation={phase === 'walk' ? 'walk' : phase === 'stop' ? 'idle' : 'fuse'}
            repeat={phase === 'fuse' ? 1 : undefined}
            title="Creeper"
          />
        </motion.div>
      )}

      {/* Explosão: clarão + blocos voando + fumaça */}
      {exploded && (
        <div className="absolute left-1/2" style={{ bottom: originBottom }} aria-hidden="true">
          {/* Bola de fogo que cresce até cobrir a tela inteira */}
          <span className="intro-blast" style={{ width: reach * 2.2, height: reach * 2.2 }} />
          {debris.map((d, i) => (
            <span
              key={i}
              className="intro-debris"
              style={{ '--dx': `${d.dx}px`, '--dy': `${d.dy}px`, width: d.size, height: d.size, background: d.color, animationDelay: `${d.delay}s` } as CSSProperties}
            />
          ))}
          {smoke.map((m, i) => (
            <span
              key={`s${i}`}
              className="intro-smoke"
              style={{ '--dx': `${m.dx}px`, '--dy': `${m.dy}px`, width: m.size, height: m.size, animationDelay: `${0.15 + m.delay}s` } as CSSProperties}
            />
          ))}
        </div>
      )}
      {phase === 'boom' && <div className="intro-flash absolute inset-0 bg-white" aria-hidden="true" />}
    </motion.div>
  );
}
