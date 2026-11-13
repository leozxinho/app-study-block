import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useReduceMotion } from '../../lib/motion';
import {motion, useAnimate} from 'framer-motion';
import { World, AdventureLevel, LevelStatus } from '../../types';
import { LevelNode } from './LevelNode';
import { LevelPath } from './LevelPath';
import { Mob, MobWalker, getMobPixelSize } from '../mobs';
import { WORLD_THEMES } from '../../data/worldThemes';
import { useGameStats } from '../../services/gameStatsService';

const PLAYER_SIZE = 34;
const PLAYER = getMobPixelSize('steve', PLAYER_SIZE);
const STEP_SECONDS = 0.3;
/** Posições fixas dos enfeites: [esquerda %, topo %, tamanho] */
const DECOR_SPOTS: [number, number, number][] = [
  [4, 6, 28], [88, 10, 24], [46, 3, 20], [12, 46, 22], [80, 50, 30], [55, 62, 22], [28, 30, 18], [70, 28, 18],
];

interface WorldSectionProps {
  world: World;
  levels: AdventureLevel[];
  levelProgress: Record<number, { status: LevelStatus; stars: number }>;
  currentLevel: number;
  onLevelClick: (levelNumber: number) => void;
  isUnlocked: boolean;
}

export function WorldSection({
  world,
  levels,
  levelProgress,
  currentLevel,
  onLevelClick,
  isUnlocked,
}: WorldSectionProps) {
  const theme = WORLD_THEMES[Math.min(world.worldOrder - 1, 9)] ?? WORLD_THEMES[0];

  // Organize levels into snaking rows
  const sortedLevels = [...levels].sort((a, b) => a.levelNumber - b.levelNumber);
  const rows = [
    sortedLevels.slice(0, 3),  // Row 1: levels 1-3 (left to right)
    sortedLevels.slice(3, 5),  // Row 2: levels 4-5 (right to left)
    sortedLevels.slice(5, 8),  // Row 3: levels 6-8 (left to right)
    sortedLevels.slice(8, 10), // Row 4: levels 9-10 (right to left)
  ];

  const getDirectionForRow = (rowIndex: number): 'up' | 'down' | 'straight' => {
    if (rowIndex % 2 === 0) return 'straight';
    return rowIndex === 1 ? 'down' : 'up';
  };

  const getLevelProgress = (levelNumber: number) => {
    return levelProgress[levelNumber] || { status: 'locked' as LevelStatus, stars: 0 };
  };

  const isPathCompleted = (levelNumber: number) => {
    const progress = getLevelProgress(levelNumber);
    return progress.status === 'completed';
  };

  // ---------- Personagem do jogador andando pela trilha ----------
  const showPlayer = isUnlocked && levels.some((l) => l.levelNumber === currentLevel);
  const trailRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [playerScope, animatePlayer] = useAnimate<HTMLDivElement>();
  const walkingRef = useRef(false);
  const [walking, setWalking] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const reduceMotion = useReduceMotion();
  const { skin } = useGameStats();

  // Posição (dentro da trilha) para o personagem ficar em pé sobre a fase
  const getAnchor = useCallback((levelNumber: number) => {
    const node = nodeRefs.current[levelNumber];
    const trail = trailRef.current;
    if (!node || !trail) return null;
    const n = node.getBoundingClientRect();
    const t = trail.getBoundingClientRect();
    return {
      x: n.left - t.left + n.width / 2 - PLAYER.width / 2,
      y: n.top - t.top - PLAYER.height + 8,
    };
  }, []);

  useLayoutEffect(() => {
    if (!showPlayer || !trailRef.current) return;
    const place = () => {
      if (walkingRef.current || !playerScope.current) return;
      const a = getAnchor(currentLevel);
      if (!a) return;
      animatePlayer(playerScope.current, { x: a.x, y: a.y }, { duration: 0 });
      setPlaced(true);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(trailRef.current);
    return () => ro.disconnect();
  }, [showPlayer, currentLevel, getAnchor, animatePlayer, playerScope]);

  const handleNodeClick = async (target: number) => {
    if (walkingRef.current) return;
    if (!showPlayer || reduceMotion || target === currentLevel || !playerScope.current) {
      onLevelClick(target);
      return;
    }

    walkingRef.current = true;
    setWalking(true);
    const step = target > currentLevel ? 1 : -1;
    let prevX = getAnchor(currentLevel)?.x ?? 0;

    // Anda de fase em fase pela trilha até chegar na escolhida
    for (let n = currentLevel + step; step > 0 ? n <= target : n >= target; n += step) {
      const a = getAnchor(n);
      if (!a) continue;
      if (Math.abs(a.x - prevX) > 1) setFacing(a.x < prevX ? 'left' : 'right');
      await animatePlayer(
        playerScope.current,
        { x: a.x, y: a.y },
        { duration: STEP_SECONDS, ease: 'linear' }
      );
      prevX = a.x;
    }

    walkingRef.current = false;
    setWalking(false);
    onLevelClick(target);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8"
    >
      {/* World Header */}
      <div
        className={`
          rounded-xl pixel-border p-4 md:p-6 mb-4
          bg-gradient-to-r ${world.bgColor}
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl md:text-4xl">{world.icon}</span>
          <div>
            <h2 className="font-minecraft text-lg md:text-xl text-white drop-shadow-md">
              {world.name}
            </h2>
            <p className="font-body text-xs md:text-sm text-white/80">
              {world.description}
            </p>
          </div>
        </div>
      </div>

      {/* Levels Trail (fundo e enfeites do tema do mundo) */}
      <div
        ref={trailRef}
        className={`relative bg-gradient-to-b ${theme.trailBg} rounded-xl pixel-border p-4 md:p-6 pb-20 md:pb-20 overflow-hidden`}
      >
        {/* Enfeites do mundo espalhados no fundo */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {DECOR_SPOTS.map(([left, top, size], i) => (
            <span
              key={i}
              className="absolute opacity-30 select-none"
              style={{ left: `${left}%`, top: `${top}%`, fontSize: size }}
            >
              {theme.decor[i % theme.decor.length]}
            </span>
          ))}
        </div>

        {/* Mobs do mundo passeando no chão da trilha */}
        {isUnlocked && (
          <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-auto">
            <div className="absolute inset-x-0 bottom-0 h-3 bg-black/10" aria-hidden="true" />
            {theme.walkers.map((type, i) => (
              <MobWalker key={`${type}-${i}`} type={type} size={36} duration={16 + i * 5} offset={i * 0.33} />
            ))}
          </div>
        )}
        {/* Personagem do jogador */}
        {showPlayer && (
          <div
            ref={playerScope}
            className="absolute top-0 left-0 z-[5] pointer-events-none"
            style={{ opacity: placed ? 1 : 0 }}
          >
            <Mob
              type={skin.character}
              skin={skin}
              size={PLAYER_SIZE}
              animation={walking ? 'walk' : 'idle'}
              facing={facing}
              title="Você"
            />
          </div>
        )}

        {/* Lock Overlay */}
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center"
          >
            <span className="text-5xl mb-3">🔒</span>
            <p className="font-minecraft text-white text-sm md:text-base">
              Mundo Bloqueado
            </p>
            <p className="font-body text-gray-300 text-xs mt-1">
              Complete o mundo anterior para desbloquear!
            </p>
          </motion.div>
        )}

        {/* Snaking Trail */}
        <div className="flex flex-col items-center gap-2">
          {rows.map((row, rowIndex) => {
            const isReversed = rowIndex % 2 === 1;
            const displayRow = isReversed ? [...row].reverse() : row;

            return (
              <div key={rowIndex}>
                {/* Connection path from previous row */}
                {rowIndex > 0 && (
                  <div className="flex justify-center mb-2">
                    <LevelPath
                      completed={isPathCompleted(rows[rowIndex][0]?.levelNumber ?? 0)}
                      direction={getDirectionForRow(rowIndex)}
                    />
                  </div>
                )}

                {/* Level nodes in this row */}
                <div
                  className={`
                    flex items-center justify-around gap-4 md:gap-6
                    ${isReversed ? 'flex-row-reverse' : 'flex-row'}
                  `}
                >
                  {displayRow.map((level, levelIndex) => {
                    const progress = getLevelProgress(level.levelNumber);
                    const showPath =
                      levelIndex < displayRow.length - 1;

                    return (
                      <div key={level.id} className="flex items-center gap-2 md:gap-3">
                        <div ref={(el) => { nodeRefs.current[level.levelNumber] = el; }}>
                          <LevelNode
                            levelNumber={level.levelNumber}
                            status={progress.status}
                            stars={progress.stars}
                            isCurrentLevel={level.levelNumber === currentLevel}
                            onClick={() => handleNodeClick(level.levelNumber)}
                          />
                        </div>
                        {showPath && (
                          <div className="rotate-90">
                            <LevelPath
                              completed={isPathCompleted(level.levelNumber)}
                              direction="straight"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
