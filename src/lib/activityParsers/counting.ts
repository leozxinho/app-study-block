import type { Activity } from '../../types';
import type { MobType } from '../../components/mobs/mobSprites';
import type { BlockKind } from '../../components/activities/shared/pixelSprites';
import { randInt, shuffle } from '../random';
import { hasWord, normalize, stripNumberHints } from '../text';
import { ageCountRange, numericOptions, type ParseMeta } from './common';

/** O que aparece para contar: um emoji, um mob, ou figuras variadas. */
export interface CountIcon {
  emoji?: string;
  mob?: MobType;
  /** Bloco pixel (diamante, ouro, pedra...) */
  block?: BlockKind;
  varied?: { emoji?: string; mob?: MobType; block?: BlockKind }[];
}

export interface CountingData extends ParseMeta {
  count: number;
  range: [number, number];
  icon: CountIcon;
  options: number[];
  /** Pergunta sem as dicas "(1-3)" */
  displayQuestion: string;
}

// Mais específico primeiro (expressões de várias palavras antes das simples)
const ICONS: { keys: string[]; icon: CountIcon }[] = [
  { keys: ['boneco de neve', 'bonecos de neve'], icon: { emoji: '⛄' } },
  { keys: ['bola de neve', 'bolas de neve'], icon: { emoji: '⚪' } },
  { keys: ['blocos coloridos', 'bloco colorido'], icon: { varied: (['redstone', 'diamante', 'grama', 'ouro', 'pedra', 'tabua'] as BlockKind[]).map((block) => ({ block })) } },
  { keys: ['mobs diferentes', 'mobs'], icon: { varied: (['pig', 'sheep', 'cow', 'chicken', 'creeper', 'wolf'] as MobType[]).map((mob) => ({ mob })) } },
  { keys: ['animais', 'animal'], icon: { varied: (['pig', 'sheep', 'cow', 'chicken', 'wolf'] as MobType[]).map((mob) => ({ mob })) } },
  { keys: ['bloco de ouro', 'blocos de ouro', 'ouro', 'dourado'], icon: { block: 'ouro' } },
  { keys: ['bloco de fogo', 'blocos de fogo', 'chama', 'chamas', 'fogo'], icon: { emoji: '🔥' } },
  { keys: ['cubo de magma', 'cubos de magma', 'magma'], icon: { emoji: '🟧' } },
  { keys: ['portal', 'portais'], icon: { emoji: '🌀' } },
  { keys: ['floco', 'flocos', 'neve'], icon: { emoji: '❄️' } },
  { keys: ['estrela', 'estrelas'], icon: { emoji: '⭐' } },
  { keys: ['diamante', 'diamantes', 'gema', 'gemas', 'mineral', 'minerais'], icon: { block: 'diamante' } },
  { keys: ['esmeralda', 'esmeraldas'], icon: { emoji: '💚' } },
  { keys: ['rubi', 'rubis', 'redstone'], icon: { block: 'redstone' } },
  { keys: ['cristal', 'cristais'], icon: { emoji: '🔮' } },
  { keys: ['pedra', 'pedras', 'minerio', 'minerios'], icon: { block: 'pedra' } },
  { keys: ['galinha', 'galinhas'], icon: { mob: 'chicken' } },
  { keys: ['ovelha', 'ovelhas'], icon: { mob: 'sheep' } },
  { keys: ['vaca', 'vacas'], icon: { mob: 'cow' } },
  { keys: ['porco', 'porcos'], icon: { mob: 'pig' } },
  { keys: ['lobo', 'lobos'], icon: { mob: 'wolf' } },
  { keys: ['creeper', 'creepers'], icon: { mob: 'creeper' } },
  { keys: ['enderman', 'endermen'], icon: { mob: 'enderman' } },
  { keys: ['morador', 'moradores', 'aldeao', 'aldeoes'], icon: { mob: 'villager' } },
  { keys: ['peixe', 'peixes'], icon: { emoji: '🐟' } },
  { keys: ['arvore', 'arvores'], icon: { emoji: '🌳' } },
  { keys: ['flor', 'flores'], icon: { emoji: '🌸' } },
  { keys: ['borboleta', 'borboletas'], icon: { emoji: '🦋' } },
  { keys: ['cogumelo', 'cogumelos'], icon: { emoji: '🍄' } },
  { keys: ['concha', 'conchas'], icon: { emoji: '🐚' } },
  { keys: ['pinguim', 'pinguins'], icon: { emoji: '🐧' } },
  { keys: ['cacto', 'cactos'], icon: { emoji: '🌵' } },
  { keys: ['piramide', 'piramides'], icon: { emoji: '🔺' } },
  { keys: ['casa', 'casas'], icon: { emoji: '🏠' } },
  { keys: ['torre', 'torres'], icon: { emoji: '🏰' } },
  { keys: ['bandeira', 'bandeiras'], icon: { emoji: '🚩' } },
  { keys: ['espada', 'espadas'], icon: { emoji: '⚔️' } },
  { keys: ['pocao', 'pocoes'], icon: { emoji: '🧪' } },
  { keys: ['tesouro', 'tesouros'], icon: { emoji: '💰' } },
  { keys: ['luz', 'luzes'], icon: { emoji: '💡' } },
  { keys: ['objeto', 'objetos'], icon: { emoji: '📦' } },
  { keys: ['bloco', 'blocos'], icon: { block: 'grama' } },
];

/** Faixa pedida na pergunta: "(2-4)", "(5)", "(1 ou 2)", "(1, 2 ou 3)". */
export function parseCountHint(question: string): [number, number] | null {
  const range = question.match(/\((\d+)\s*[-–]\s*(\d+)\)/);
  if (range) return [Math.min(+range[1], +range[2]), Math.max(+range[1], +range[2])];
  const list = question.match(/\(((?:\s*\d+\s*(?:,|ou|e)?)+)\)/);
  if (list) {
    const n = (list[1].match(/\d+/g) ?? []).map(Number);
    if (n.length) return [Math.min(...n), Math.max(...n)];
  }
  return null;
}

export function findCountIcon(question: string): CountIcon | null {
  for (const entry of ICONS) {
    if (entry.keys.some((k) => hasWord(question, k))) return entry.icon;
  }
  return null;
}

export function parseCounting(activity: Pick<Activity, 'id' | 'question' | 'age_group' | 'difficulty'>): CountingData {
  const hint = parseCountHint(activity.question);
  const range = hint ?? ageCountRange(activity);
  const count = randInt(range[0], range[1]);
  const icon = findCountIcon(normalize(activity.question));
  const varied = icon?.varied ? { varied: shuffle(icon.varied) } : null;
  const notes: string[] = [];
  if (!icon) notes.push('objeto contado não reconhecido (mostra blocos genéricos)');
  if (range[0] < 1) notes.push('faixa começa em 0');
  return {
    recognized: notes.length === 0,
    note: notes.join('; ') || undefined,
    count,
    range,
    icon: varied ?? icon ?? { block: 'grama' },
    options: shuffle(numericOptions(count, 4, 1)),
    displayQuestion: stripNumberHints(activity.question),
  };
}
