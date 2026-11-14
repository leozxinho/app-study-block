import type { MobType } from '../components/mobs/mobSprites';

/**
 * Cara de cada mundo da aventura (mesma ordem de ADVENTURE_WORLDS):
 * mobs que passeiam no mapa, enfeites, o chefe da fase 10 e as figurinhas do álbum.
 */
export interface WorldBoss {
  type: MobType;
  name: string;
  /** Filtro CSS para variar a cor do mob (o chefe fica diferente do mob comum) */
  filter?: string;
}

export interface WorldTheme {
  walkers: MobType[];
  decor: string[];
  /** Fundo da trilha do mapa */
  trailBg: string;
  /** Cenário da tela da fase: céu (gradiente Tailwind) e chão (cor CSS) */
  sky: string;
  ground: string;
  /** Céu escuro: textos soltos na tela ficam claros */
  dark?: boolean;
  /** Barra do topo da fase (cor do mundo, escura o bastante para texto branco) */
  bar: string;
  boss: WorldBoss;
  /** 10 figurinhas (uma por fase do mundo) */
  stickers: { icon: string; name: string }[];
}

const s = (list: string): { icon: string; name: string }[] =>
  list.split('|').map((pair) => {
    const [icon, name] = pair.split(':');
    return { icon, name };
  });

export const WORLD_THEMES: WorldTheme[] = [
  {
    walkers: ['villager', 'chicken', 'pig'],
    decor: ['🏠', '🌻', '🌾', '🏡'],
    trailBg: 'from-lime-100 to-green-200',
    sky: 'from-sky-300 via-sky-200 to-lime-100',
    ground: 'linear-gradient(#5d9e37 0 25%, #8b5a2b 25%)',
    bar: 'bg-green-800/95',
    boss: { type: 'zombie', name: 'Zumbi da Vila' },
    stickers: s('🏠:Casinha|🐔:Galinha|🐷:Porquinho|🌻:Girassol|🥕:Cenoura|🍞:Pão|🔔:Sino|🪣:Balde|🌾:Trigo|🧑‍🌾:Aldeão'),
  },
  {
    walkers: ['wolf', 'sheep', 'cow'],
    decor: ['🌲', '🍄', '🌳', '🌿'],
    trailBg: 'from-green-100 to-emerald-200',
    sky: 'from-emerald-800 via-emerald-600 to-green-300',
    ground: 'linear-gradient(#2e6b22 0 25%, #5c3d1e 25%)',
    bar: 'bg-emerald-900/95',
    dark: true,
    boss: { type: 'skeleton', name: 'Arqueiro da Floresta', filter: 'sepia(0.4)' },
    stickers: s('🌲:Pinheiro|🍄:Cogumelo|🐺:Lobo|🍎:Maçã|🦊:Raposa|🐝:Abelha|🌸:Flor|🪵:Tronco|🦉:Coruja|🐑:Ovelha'),
  },
  {
    walkers: ['steve', 'skeleton', 'pig'],
    decor: ['⛏️', '💎', '🪨', '🔦'],
    trailBg: 'from-stone-200 to-stone-300',
    sky: 'from-stone-900 via-stone-700 to-stone-500',
    ground: 'repeating-linear-gradient(90deg, #6b6b6b 0 18px, #5a5a5a 18px 20px)',
    bar: 'bg-stone-800/95',
    dark: true,
    boss: { type: 'skeleton', name: 'Esqueleto da Mina', filter: 'brightness(0.8)' },
    stickers: s('⛏️:Picareta|💎:Diamante|🪨:Pedra|🔦:Tocha|🟫:Terra|⚙️:Engrenagem|🪙:Moeda|🧱:Tijolo|🛤️:Trilho|📦:Baú'),
  },
  {
    walkers: ['villager', 'zombie', 'chicken'],
    decor: ['🌵', '🏜️', '☀️', '🐫'],
    trailBg: 'from-yellow-100 to-amber-200',
    sky: 'from-orange-300 via-amber-200 to-yellow-100',
    ground: 'linear-gradient(#e8d28c 0 30%, #d8bd6c 30%)',
    bar: 'bg-amber-800/95',
    boss: { type: 'zombie', name: 'Múmia do Deserto', filter: 'sepia(0.9) saturate(1.5)' },
    stickers: s('🌵:Cacto|🐫:Camelo|🦂:Escorpião|☀️:Sol|🏺:Vaso|🔺:Pirâmide|🦎:Lagarto|🌴:Oásis|🧭:Bússola|👑:Coroa'),
  },
  {
    walkers: ['sheep', 'cow', 'wolf'],
    decor: ['🌊', '🐠', '🐚', '🪸'],
    trailBg: 'from-cyan-100 to-sky-200',
    sky: 'from-sky-600 via-cyan-400 to-cyan-100',
    ground: 'linear-gradient(#2f8fd8 0 40%, #e8d28c 40%)',
    bar: 'bg-sky-800/95',
    boss: { type: 'zombie', name: 'Afogado do Mar', filter: 'hue-rotate(120deg)' },
    stickers: s('🐠:Peixe|🐙:Polvo|🐢:Tartaruga|🐚:Concha|🦀:Caranguejo|🐬:Golfinho|🪸:Coral|⚓:Âncora|🐳:Baleia|🏝️:Ilha'),
  },
  {
    walkers: ['wolf', 'sheep', 'steve'],
    decor: ['❄️', '⛄', '🏔️', '🌨️'],
    trailBg: 'from-sky-50 to-blue-100',
    sky: 'from-slate-400 via-slate-200 to-white',
    ground: 'linear-gradient(#ffffff 0 35%, #c9d6e3 35%)',
    bar: 'bg-slate-700/95',
    boss: { type: 'skeleton', name: 'Errante do Gelo', filter: 'hue-rotate(180deg) brightness(1.2)' },
    stickers: s('❄️:Floco|⛄:Boneco de neve|🐧:Pinguim|🧊:Gelo|🦭:Foca|🧣:Cachecol|🏔️:Montanha|🛷:Trenó|🐻‍❄️:Urso polar|🧤:Luva'),
  },
  {
    walkers: ['zombie', 'skeleton', 'creeper'],
    decor: ['🔥', '🌋', '💀', '🟥'],
    trailBg: 'from-red-100 to-orange-200',
    sky: 'from-red-950 via-red-800 to-orange-700',
    ground: 'repeating-linear-gradient(90deg, #7a1f1f 0 14px, #5e1616 14px 16px)',
    bar: 'bg-red-900/95',
    dark: true,
    boss: { type: 'creeper', name: 'Estourinho de Fogo', filter: 'hue-rotate(260deg) saturate(2)' },
    stickers: s('🔥:Fogo|🌋:Vulcão|💀:Caveira|🟥:Pedra vermelha|🧨:Dinamite|⚔️:Espadas|🛡️:Escudo|🍖:Carne|🪔:Lamparina|🌑:Portal'),
  },
  {
    walkers: ['villager', 'skeleton', 'zombie'],
    decor: ['🏰', '🚩', '🗝️', '⚔️'],
    trailBg: 'from-violet-100 to-purple-200',
    sky: 'from-violet-950 via-violet-800 to-purple-500',
    ground: 'repeating-linear-gradient(0deg, #6b6b78 0 10px, #4e4e5a 10px 12px)',
    bar: 'bg-violet-900/95',
    dark: true,
    boss: { type: 'zombie', name: 'Cavaleiro Zumbi', filter: 'hue-rotate(200deg)' },
    stickers: s('🏰:Castelo|🗝️:Chave|🚩:Bandeira|⚔️:Espada|🛡️:Escudo|👑:Coroa|🐉:Dragão|🏹:Arco|📜:Pergaminho|💰:Tesouro'),
  },
  {
    walkers: ['enderman', 'enderman', 'creeper'],
    decor: ['🌌', '✨', '🟣', '🌙'],
    trailBg: 'from-indigo-200 to-purple-300',
    sky: 'from-black via-indigo-950 to-purple-900',
    ground: 'linear-gradient(#e6e2a8 0 30%, #cfc98d 30%)',
    bar: 'bg-indigo-950/95',
    dark: true,
    boss: { type: 'enderman', name: 'Sombrio Gigante' },
    stickers: s('🌌:Galáxia|✨:Brilho|🟣:Pérola|🌙:Lua|⭐:Estrela|🔮:Cristal|🚀:Foguete|🪐:Planeta|☄️:Cometa|🐉:Dragão do Fim'),
  },
  {
    walkers: ['faisca', 'luna', 'alex'],
    decor: ['🏆', '🎉', '⭐', '🎖️'],
    trailBg: 'from-yellow-100 to-amber-200',
    sky: 'from-yellow-300 via-amber-200 to-orange-100',
    ground: 'linear-gradient(#f6d32d 0 30%, #e5a50a 30%)',
    bar: 'bg-orange-700/95',
    boss: { type: 'creeper', name: 'Rei Estourinho', filter: 'hue-rotate(40deg) saturate(1.6)' },
    stickers: s('🏆:Troféu|🎉:Festa|🎖️:Medalha|🥇:Ouro|🎁:Presente|🎈:Balão|🎂:Bolo|🎆:Fogos|🎺:Trompete|👑:Coroa de rei'),
  },
];

export function themeForLevel(levelNumber: number): WorldTheme {
  return WORLD_THEMES[Math.min(Math.floor((levelNumber - 1) / 10), 9)];
}

/** Figurinha ganha ao concluir a fase. */
export function stickerForLevel(levelNumber: number): { icon: string; name: string } {
  return themeForLevel(levelNumber).stickers[(levelNumber - 1) % 10];
}

export const isBossLevel = (levelNumber: number) => levelNumber % 10 === 0;
