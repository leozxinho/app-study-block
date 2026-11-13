import type { Activity } from '../../types';
import { pickRandom, sample, shuffle } from '../random';
import { hasWord, normalize } from '../text';
import type { ParseMeta } from './common';

// =============================================================
// TOQUE NO CERTO (click-correct)
// =============================================================

export interface ClickItem {
  id: string;
  label: string;
  emoji: string;
  color: string;
  /** Outras formas de escrever (plural, diminutivo, sinônimo) */
  aliases?: string[];
  /** Tamanho relativo (para "toque no maior") */
  scale?: number;
}

type SetName = 'animals' | 'nature' | 'objects' | 'blocks';

export const ITEM_SETS: Record<SetName, ClickItem[]> = {
  animals: [
    { id: 'sheep', label: 'Ovelha', emoji: '🐑', color: 'bg-green-100', aliases: ['ovelhinha'] },
    { id: 'cow', label: 'Vaca', emoji: '🐄', color: 'bg-blue-100', aliases: ['vaquinha'] },
    { id: 'chicken', label: 'Galinha', emoji: '🐔', color: 'bg-yellow-100', aliases: ['pintinho', 'galo'] },
    { id: 'pig', label: 'Porco', emoji: '🐷', color: 'bg-pink-100', aliases: ['porquinho', 'porca'] },
    { id: 'rabbit', label: 'Coelho', emoji: '🐰', color: 'bg-purple-100', aliases: ['coelhinho'] },
    { id: 'cat', label: 'Gato', emoji: '🐱', color: 'bg-orange-100', aliases: ['gatinho'] },
    { id: 'dog', label: 'Cachorro', emoji: '🐶', color: 'bg-amber-100', aliases: ['cachorrinho'] },
    { id: 'bird', label: 'Pássaro', emoji: '🐦', color: 'bg-sky-100', aliases: ['passarinho', 'passaro'] },
    { id: 'fish', label: 'Peixe', emoji: '🐟', color: 'bg-cyan-100', aliases: ['peixinho'] },
    { id: 'turtle', label: 'Tartaruga', emoji: '🐢', color: 'bg-emerald-100' },
    { id: 'bear', label: 'Urso', emoji: '🐻', color: 'bg-amber-100' },
    { id: 'penguin', label: 'Pinguim', emoji: '🐧', color: 'bg-slate-100' },
    { id: 'butterfly', label: 'Borboleta', emoji: '🦋', color: 'bg-sky-100' },
    { id: 'bee', label: 'Abelha', emoji: '🐝', color: 'bg-yellow-100' },
    { id: 'octopus', label: 'Polvo', emoji: '🐙', color: 'bg-pink-100' },
    { id: 'seal', label: 'Foca', emoji: '🦭', color: 'bg-slate-100' },
    { id: 'camel', label: 'Camelo', emoji: '🐫', color: 'bg-amber-100' },
    { id: 'scorpion', label: 'Escorpião', emoji: '🦂', color: 'bg-orange-100' },
    { id: 'villager', label: 'Morador', emoji: '🧑‍🌾', color: 'bg-amber-100', aliases: ['aldeao', 'villager', 'moradora'] },
  ],
  nature: [
    { id: 'tree', label: 'Árvore', emoji: '🌳', color: 'bg-green-100', aliases: ['arvore'] },
    { id: 'flower', label: 'Flor', emoji: '🌺', color: 'bg-pink-100', aliases: ['florzinha'] },
    { id: 'sun', label: 'Sol', emoji: '☀️', color: 'bg-yellow-100' },
    { id: 'star', label: 'Estrela', emoji: '⭐', color: 'bg-yellow-100' },
    { id: 'moon', label: 'Lua', emoji: '🌙', color: 'bg-blue-100' },
    { id: 'cloud', label: 'Nuvem', emoji: '☁️', color: 'bg-gray-100' },
    { id: 'leaf', label: 'Folha', emoji: '🍃', color: 'bg-green-100' },
    { id: 'cactus', label: 'Cacto', emoji: '🌵', color: 'bg-green-100' },
    { id: 'mushroom', label: 'Cogumelo', emoji: '🍄', color: 'bg-red-100' },
    { id: 'rock', label: 'Pedra', emoji: '🪨', color: 'bg-gray-100' },
    { id: 'crystal', label: 'Cristal', emoji: '🔮', color: 'bg-purple-100' },
    { id: 'oasis', label: 'Oásis', emoji: '🏝️', color: 'bg-cyan-100', aliases: ['oasis'] },
    { id: 'planet', label: 'Planeta', emoji: '🪐', color: 'bg-indigo-100' },
    { id: 'rainbow', label: 'Arco-íris', emoji: '🌈', color: 'bg-sky-100', aliases: ['arco iris'] },
  ],
  objects: [
    { id: 'house', label: 'Casa', emoji: '🏠', color: 'bg-amber-100', aliases: ['casinha'] },
    { id: 'key', label: 'Chave', emoji: '🔑', color: 'bg-yellow-100' },
    { id: 'crown', label: 'Coroa', emoji: '👑', color: 'bg-yellow-100' },
    { id: 'door', label: 'Porta', emoji: '🚪', color: 'bg-amber-100' },
    { id: 'diamond', label: 'Diamante', emoji: '💎', color: 'bg-cyan-100' },
    { id: 'sword', label: 'Espada', emoji: '⚔️', color: 'bg-gray-100' },
    { id: 'shell', label: 'Concha', emoji: '🐚', color: 'bg-pink-100' },
    { id: 'snowflake', label: 'Floco de neve', emoji: '❄️', color: 'bg-blue-100', aliases: ['floco'] },
    { id: 'fire', label: 'Fogo', emoji: '🔥', color: 'bg-red-100', aliases: ['chama', 'fogueira'] },
    { id: 'castle', label: 'Castelo', emoji: '🏰', color: 'bg-purple-100' },
    { id: 'boat', label: 'Barco', emoji: '⛵', color: 'bg-blue-100' },
    { id: 'igloo', label: 'Iglu', emoji: '🛖', color: 'bg-blue-100' },
    { id: 'pickaxe', label: 'Picareta', emoji: '⛏️', color: 'bg-gray-100' },
    { id: 'minecart', label: 'Carrinho de mina', emoji: '🛒', color: 'bg-gray-100', aliases: ['carrinho'] },
    { id: 'pyramid', label: 'Pirâmide', emoji: '🔺', color: 'bg-yellow-100', aliases: ['piramide'] },
    { id: 'snowman', label: 'Boneco de neve', emoji: '⛄', color: 'bg-blue-100' },
    { id: 'shield', label: 'Escudo', emoji: '🛡️', color: 'bg-gray-100' },
    { id: 'treasure', label: 'Tesouro', emoji: '💰', color: 'bg-yellow-100', aliases: ['bau'] },
    { id: 'tower', label: 'Torre', emoji: '🗼', color: 'bg-gray-100' },
    { id: 'rocket', label: 'Foguete', emoji: '🚀', color: 'bg-indigo-100' },
    { id: 'trophy', label: 'Troféu', emoji: '🏆', color: 'bg-yellow-100', aliases: ['trofeu'] },
    { id: 'portal', label: 'Portal', emoji: '🌀', color: 'bg-purple-100' },
  ],
  blocks: [
    { id: 'red', label: 'Vermelho', emoji: '🟥', color: 'bg-red-100', aliases: ['vermelha'] },
    { id: 'blue', label: 'Azul', emoji: '🟦', color: 'bg-blue-100' },
    { id: 'green', label: 'Verde', emoji: '🟩', color: 'bg-green-100' },
    { id: 'yellow', label: 'Amarelo', emoji: '🟨', color: 'bg-yellow-100', aliases: ['amarela'] },
    { id: 'purple', label: 'Roxo', emoji: '🟪', color: 'bg-purple-100', aliases: ['roxa'] },
    { id: 'orange', label: 'Laranja', emoji: '🟧', color: 'bg-orange-100' },
  ],
};

const SHINY = ['diamond', 'star', 'crystal', 'crown', 'trophy'];
const ALL_ITEMS = Object.values(ITEM_SETS).flat();

export interface ClickData extends ParseMeta {
  items: (ClickItem & { isCorrect: boolean })[];
  anyCorrect: boolean;
  target?: ClickItem;
}

function setOf(item: ClickItem): SetName | undefined {
  return (Object.keys(ITEM_SETS) as SetName[]).find((k) => ITEM_SETS[k].some((i) => i.id === item.id));
}

/** Item citado na pergunta (a expressão mais longa ganha: "boneco de neve" > "neve"). */
export function findClickTarget(question: string): ClickItem | null {
  let best: { item: ClickItem; len: number } | null = null;
  for (const item of ALL_ITEMS) {
    for (const name of [item.label, ...(item.aliases ?? [])]) {
      if (hasWord(question, name) && (!best || name.length > best.len)) best = { item, len: name.length };
    }
  }
  return best?.item ?? null;
}

function withWrongs(target: ClickItem, pool: ClickItem[]): ClickData['items'] {
  const wrongs = sample(pool.filter((p) => p.id !== target.id), 3).map((w) => ({ ...w, isCorrect: false }));
  return shuffle([{ ...target, isCorrect: true }, ...wrongs]);
}

export function parseClick(activity: Pick<Activity, 'question'>): ClickData {
  const q = normalize(activity.question);

  // "Toque no bloco" sem cor: qualquer um serve
  if (q.includes('toque no bloco') && !ITEM_SETS.blocks.some((b) => [b.label, ...(b.aliases ?? [])].some((n) => hasWord(q, n)))) {
    return { recognized: true, anyCorrect: true, items: shuffle(ITEM_SETS.blocks.slice(0, 4)).map((i) => ({ ...i, isCorrect: true })) };
  }

  // "Toque no número 7"
  const num = q.match(/numero\s+(\d+)/);
  if (num) {
    const n = +num[1];
    const others = sample([n - 2, n - 1, n + 1, n + 2, n + 3].filter((x) => x >= 0), 3);
    const make = (v: number): ClickItem => ({ id: `n${v}`, label: `Número ${v}`, emoji: String(v), color: 'bg-stone-100' });
    return { recognized: true, anyCorrect: false, target: make(n), items: shuffle([{ ...make(n), isCorrect: true }, ...others.map((o) => ({ ...make(o), isCorrect: false }))]) };
  }

  // "Toque no objeto maior": a mesma figura em tamanhos diferentes
  if (/(maior|grande)/.test(q) && /(objeto|bloco|caixa)/.test(q)) {
    const base: ClickItem = { id: 'box', label: 'Caixa', emoji: '📦', color: 'bg-amber-50' };
    const sizes = shuffle([0.6, 0.8, 1, 1.35]);
    const big = Math.max(...sizes);
    // Todas se chamam "Caixa": o nome não pode entregar a resposta
    const target = { ...base, id: 'box-big', scale: big };
    return {
      recognized: true, anyCorrect: false, target,
      items: sizes.map((s, i) => ({ ...base, id: s === big ? 'box-big' : `box-${i}`, label: `Caixa ${i + 1}`, scale: s, isCorrect: s === big })),
    };
  }

  const target = findClickTarget(q);
  if (target) {
    // Distratores do mesmo grupo (animais com animais...)
    return { recognized: true, anyCorrect: false, target, items: withWrongs(target, ITEM_SETS[setOf(target) ?? 'nature']) };
  }

  // "Toque no animal": 1 animal entre coisas que NÃO são animais (assim só há uma resposta)
  if (/(animal|bicho)/.test(q)) {
    const t = pickRandom(ITEM_SETS.animals.slice(0, 8));
    return { recognized: true, anyCorrect: false, target: t, items: withWrongs(t, [...ITEM_SETS.nature, ...ITEM_SETS.objects].filter((i) => !SHINY.includes(i.id))) };
  }

  // "Toque no que brilha": 1 coisa brilhante entre coisas que não brilham
  if (/(brilh|luz)/.test(q)) {
    const shinyId = pickRandom(SHINY);
    const t = ALL_ITEMS.find((i) => i.id === shinyId)!;
    return { recognized: true, anyCorrect: false, target: t, items: withWrongs(t, ALL_ITEMS.filter((i) => !SHINY.includes(i.id) && setOf(i) !== 'blocks')) };
  }

  const t = ITEM_SETS.nature[0];
  return { recognized: false, note: 'alvo não reconhecido (a resposta certa vira "Árvore")', anyCorrect: false, target: t, items: withWrongs(t, ITEM_SETS.nature) };
}

/** Itens do mesmo grupo para as rodadas extras. */
export function clickSiblings(target: ClickItem): ClickItem[] {
  const set = setOf(target);
  return set ? ITEM_SETS[set].filter((i) => i.id !== target.id) : [];
}

// =============================================================
// LIGAR IGUAIS (matching)
// =============================================================

export interface MatchItem {
  id: string;
  icon: string;
  name: string;
  hint: string;
}

const THEMES: { keys: string[]; items: Omit<MatchItem, 'id'>[] }[] = [
  { keys: ['peixe', 'peixes', 'marinho', 'marinhos', 'mar', 'oceano'], items: [
    { icon: '🐟', name: 'Peixe azul', hint: 'é azul e tem barbatanas' }, { icon: '🐠', name: 'Peixe listrado', hint: 'tem listras coloridas' },
    { icon: '🐡', name: 'Baiacu', hint: 'é redondo e tem espinhos' }, { icon: '🦈', name: 'Tubarão', hint: 'é grande e cinza' },
    { icon: '🐙', name: 'Polvo', hint: 'tem muitos braços' }, { icon: '🦀', name: 'Caranguejo', hint: 'é vermelho e anda de lado' } ] },
  { keys: ['floco', 'flocos', 'neve', 'inverno', 'roupa', 'roupas'], items: [
    { icon: '❄️', name: 'Floco de neve', hint: 'parece uma estrela de gelo' }, { icon: '⛄', name: 'Boneco de neve', hint: 'tem chapéu e é branco' },
    { icon: '🧤', name: 'Luvas', hint: 'a gente usa nas mãos' }, { icon: '🧣', name: 'Cachecol', hint: 'a gente usa no pescoço' },
    { icon: '🧥', name: 'Casaco', hint: 'a gente veste no corpo' } ] },
  { keys: ['urso', 'ursos', 'pinguim', 'pinguins', 'polar', 'polares'], items: [
    { icon: '🐻‍❄️', name: 'Urso polar', hint: 'é um urso branco' }, { icon: '🐧', name: 'Pinguim', hint: 'é preto e branco e anda engraçado' },
    { icon: '🦭', name: 'Foca', hint: 'é cinza e nada no gelo' }, { icon: '🐻', name: 'Urso marrom', hint: 'é um urso marrom' } ] },
  { keys: ['passaro', 'passaros', 'ave', 'aves'], items: [
    { icon: '🐦', name: 'Passarinho', hint: 'é azul e pequeno' }, { icon: '🦜', name: 'Papagaio', hint: 'é bem colorido' },
    { icon: '🦉', name: 'Coruja', hint: 'tem olhos grandes' }, { icon: '🐤', name: 'Pintinho', hint: 'é amarelinho' } ] },
  { keys: ['camelo', 'camelos', 'escorpiao', 'escorpioes', 'deserto'], items: [
    { icon: '🐫', name: 'Camelo', hint: 'tem corcovas nas costas' }, { icon: '🦂', name: 'Escorpião', hint: 'tem um ferrão no rabo' },
    { icon: '🦎', name: 'Lagarto', hint: 'é verde e tem rabo comprido' }, { icon: '🐍', name: 'Cobra', hint: 'é comprida e não tem patas' } ] },
  { keys: ['tartaruga', 'tartarugas'], items: [
    { icon: '🐢', name: 'Tartaruga', hint: 'tem um casco nas costas' }, { icon: '🐊', name: 'Jacaré', hint: 'tem dentes grandes' },
    { icon: '🐸', name: 'Sapo', hint: 'é verde e pula' }, { icon: '🦎', name: 'Lagarto', hint: 'tem rabo comprido' } ] },
  { keys: ['pocao', 'pocoes'], items: [
    { icon: '🧪', name: 'Poção verde', hint: 'é um tubo fininho' }, { icon: '⚗️', name: 'Frasco redondo', hint: 'tem um bico do lado' },
    { icon: '🍯', name: 'Pote de mel', hint: 'é amarelo e doce' }, { icon: '🥛', name: 'Copo de leite', hint: 'é branco' } ] },
  { keys: ['pedra', 'pedras', 'minerio', 'minerios'], items: [
    { icon: '🪨', name: 'Pedra', hint: 'é cinza e dura' }, { icon: '💎', name: 'Diamante', hint: 'é azul e brilha' },
    { icon: '🟫', name: 'Terra', hint: 'é um quadrado marrom' }, { icon: '🟨', name: 'Ouro', hint: 'é um quadrado amarelo' } ] },
  { keys: ['villager', 'villagers', 'morador', 'moradores', 'aldeao', 'aldeoes'], items: [
    { icon: '👨‍🌾', name: 'Fazendeiro', hint: 'usa chapéu de palha' }, { icon: '🧙', name: 'Mago', hint: 'tem barba e chapéu pontudo' },
    { icon: '👷', name: 'Construtor', hint: 'usa capacete amarelo' }, { icon: '🧑‍🍳', name: 'Cozinheiro', hint: 'usa chapéu branco' } ] },
  { keys: ['ghast', 'ghasts', 'fantasma', 'fantasmas', 'olho', 'olhos', 'enderman', 'endermen'], items: [
    { icon: '👻', name: 'Fantasma', hint: 'é branco e flutua' }, { icon: '👀', name: 'Olhos', hint: 'são dois olhinhos' },
    { icon: '🔮', name: 'Bola mágica', hint: 'é roxa e redonda' }, { icon: '🦇', name: 'Morcego', hint: 'tem asas pretas' } ] },
  { keys: ['cor', 'cores'], items: [
    { icon: '🟥', name: 'Vermelho', hint: 'é vermelho' }, { icon: '🟦', name: 'Azul', hint: 'é azul' },
    { icon: '🟩', name: 'Verde', hint: 'é verde' }, { icon: '🟨', name: 'Amarelo', hint: 'é amarelo' } ] },
];

const FARM: Omit<MatchItem, 'id'>[] = [
  { icon: '🐑', name: 'Ovelha', hint: 'é branquinha e fofinha' }, { icon: '🐄', name: 'Vaca', hint: 'tem manchas pretas' },
  { icon: '🐔', name: 'Galinha', hint: 'tem crista vermelha' }, { icon: '🐷', name: 'Porco', hint: 'é cor-de-rosa' },
  { icon: '🐴', name: 'Cavalo', hint: 'tem crina' }, { icon: '🐰', name: 'Coelho', hint: 'tem orelhas compridas' },
];

export interface MatchingData extends ParseMeta {
  items: MatchItem[];
  target: MatchItem;
}

export function parseMatching(activity: Pick<Activity, 'question'>): MatchingData {
  const theme = THEMES.find((t) => t.keys.some((k) => hasWord(activity.question, k)));
  const generic = /(animal|animais|par|pares|igual|iguais|modelo|mesmo|mesma)/.test(normalize(activity.question));
  const items = sample(theme ? theme.items : FARM, 4).map((it, i) => ({ ...it, id: String(i) }));
  return {
    recognized: Boolean(theme) || generic,
    note: theme || generic ? undefined : 'tema não reconhecido (mostra animais da fazenda)',
    items,
    target: pickRandom(items),
  };
}

// =============================================================
// MEMÓRIA
// =============================================================

export interface MemoryIcon {
  icon: string;
  name: string;
}

const MEMORY_THEMES: { keys: string[]; icons: MemoryIcon[] }[] = [
  { keys: ['floresta', 'bosque'], icons: [{ icon: '🌳', name: 'Árvore' }, { icon: '🍄', name: 'Cogumelo' }, { icon: '🦋', name: 'Borboleta' }, { icon: '🐺', name: 'Lobo' }, { icon: '🌸', name: 'Flor' }, { icon: '🍃', name: 'Folha' }] },
  { keys: ['castelo', 'rei', 'cavaleiro'], icons: [{ icon: '👑', name: 'Coroa' }, { icon: '🛡️', name: 'Escudo' }, { icon: '⚔️', name: 'Espadas' }, { icon: '🏰', name: 'Castelo' }, { icon: '🗝️', name: 'Chave' }, { icon: '💰', name: 'Tesouro' }] },
  { keys: ['end'], icons: [{ icon: '🐉', name: 'Dragão' }, { icon: '🟣', name: 'Pérola' }, { icon: '👾', name: 'Criatura' }, { icon: '🌌', name: 'Céu do End' }, { icon: '🔮', name: 'Cristal' }, { icon: '⭐', name: 'Estrela' }] },
  { keys: ['oceano', 'mar', 'praia'], icons: [{ icon: '🐟', name: 'Peixe' }, { icon: '🐙', name: 'Polvo' }, { icon: '🐚', name: 'Concha' }, { icon: '🦀', name: 'Caranguejo' }, { icon: '🐬', name: 'Golfinho' }, { icon: '🌊', name: 'Onda' }] },
  { keys: ['neve', 'gelo', 'montanha', 'montanhas'], icons: [{ icon: '❄️', name: 'Floco' }, { icon: '⛄', name: 'Boneco de neve' }, { icon: '🐧', name: 'Pinguim' }, { icon: '🧤', name: 'Luvas' }, { icon: '🧊', name: 'Gelo' }, { icon: '🏔️', name: 'Montanha' }] },
  { keys: ['deserto'], icons: [{ icon: '🌵', name: 'Cacto' }, { icon: '🐫', name: 'Camelo' }, { icon: '🦂', name: 'Escorpião' }, { icon: '🔺', name: 'Pirâmide' }, { icon: '☀️', name: 'Sol' }, { icon: '🏜️', name: 'Duna' }] },
  { keys: ['nether', 'fogo', 'lava'], icons: [{ icon: '🔥', name: 'Fogo' }, { icon: '🌋', name: 'Vulcão' }, { icon: '👻', name: 'Fantasma' }, { icon: '🟧', name: 'Magma' }, { icon: '🧪', name: 'Poção' }, { icon: '💀', name: 'Caveira' }] },
  { keys: ['mina', 'minerio', 'minerios', 'bioma', 'biomas'], icons: [{ icon: '💎', name: 'Diamante' }, { icon: '⛏️', name: 'Picareta' }, { icon: '🪨', name: 'Pedra' }, { icon: '🟨', name: 'Ouro' }, { icon: '💚', name: 'Esmeralda' }, { icon: '🛒', name: 'Carrinho' }] },
];

const MEMORY_DEFAULT: MemoryIcon[] = [
  { icon: '🐑', name: 'Ovelha' }, { icon: '🐄', name: 'Vaca' }, { icon: '🐔', name: 'Galinha' }, { icon: '🐷', name: 'Porco' },
  { icon: '🌳', name: 'Árvore' }, { icon: '💎', name: 'Diamante' }, { icon: '⛏️', name: 'Picareta' }, { icon: '🏠', name: 'Casa' },
];

export const MEMORY_PAIRS = 5;

export function parseMemory(activity: Pick<Activity, 'question' | 'title'>): ParseMeta & { icons: MemoryIcon[] } {
  const text = `${activity.title} ${activity.question}`;
  const theme = MEMORY_THEMES.find((t) => t.keys.some((k) => hasWord(text, k)));
  return { recognized: true, icons: sample(theme ? theme.icons : MEMORY_DEFAULT, MEMORY_PAIRS) };
}
