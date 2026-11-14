// Sprites pixel-art próprios dos mobs, em estilo blocos.
// Cada parte (cabeça, corpo, braços, pernas...) é uma grade separada para poder animar.
// Cada caractere da grade é uma cor da paleta; '.' é transparente.

export type MobType =
  | 'steve'
  | 'alex'
  | 'creeper'
  | 'zombie'
  | 'skeleton'
  | 'enderman'
  | 'pig'
  | 'sheep'
  | 'cow'
  | 'chicken'
  | 'wolf'
  | 'villager'
  | 'luna'
  | 'faisca';

export type MobAnimation =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'celebrate'
  | 'sad'
  | 'fuse'
  | 'teleport'
  | 'mine'
  | 'fly'
  | 'power';

export const BASE_ANIMATIONS: MobAnimation[] = ['idle', 'walk', 'jump', 'celebrate', 'sad'];

// arm-a / leg-a balançam juntos em oposição a arm-b / leg-b
export type PartRole =
  | 'head'
  | 'body'
  | 'arm-a'
  | 'arm-b'
  | 'leg-a'
  | 'leg-b'
  | 'wing'
  | 'tail'
  | 'tool'
  | 'detail'
  | 'cape';

export interface PartDef {
  role: PartRole;
  x: number;
  y: number;
  rows: string[];
  /** Ponto de giro em unidades do viewBox. Padrão calculado pelo papel da parte. */
  origin?: [number, number];
  children?: PartDef[];
}

export interface MobDef {
  label: string;
  /** front = de frente (humanoides); side = de lado, olhando para a direita (animais) */
  view: 'front' | 'side';
  width: number;
  height: number;
  /** Aumenta o desenho (animais ficam maiores para crianças enxergarem melhor). Padrão 1. */
  scale?: number;
  palette: Record<string, string>;
  /** Desenhadas em ordem: as primeiras ficam atrás */
  parts: PartDef[];
  special: MobAnimation[];
}

/** Altura de referência: um humanoide tem 32 unidades. */
export const MOB_REFERENCE_HEIGHT = 32;

// ---------- helpers ----------

const fill = (w: number, h: number, c: string): string[] =>
  Array.from({ length: h }, () => c.repeat(w));

/** Grade "manchada" determinística (mesma semente = mesmo desenho). */
function mottle(w: number, h: number, chars: string, seed: number): string[] {
  let s = seed;
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) {
      s = (s * 9301 + 49297) % 233280;
      r += chars[Math.floor((s / 233280) * chars.length)];
    }
    rows.push(r);
  }
  return rows;
}

const mirror = (rows: string[]) => rows.map((r) => r.split('').reverse().join(''));

// Picareta (fica na mão direita; só aparece na animação "mine")
const PICKAXE: PartDef = {
  role: 'tool',
  x: 13,
  y: 12,
  rows: [
    '.CCCCC..',
    '......C.',
    '.....wC.',
    '....w..C',
    '...w....',
    '..w.....',
    '.w......',
    'w.......',
  ],
};

const PICKAXE_COLORS = { w: '#8b5a2b', C: '#9fb3bd' };

// ---------- humanoides (16 x 32) ----------

function humanoid(opts: {
  head: string[];
  body: string[];
  arm: string[];
  leg: string[];
  armWidth?: number;
  legWidth?: number;
  withTool?: boolean;
}): PartDef[] {
  const armW = opts.armWidth ?? 4;
  const legW = opts.legWidth ?? 4;
  const armAx = 4 - armW;
  const armBx = 12;
  const legAx = legW === 4 ? 4 : 5;
  const legBx = legW === 4 ? 8 : 9;
  return [
    { role: 'leg-a', x: legAx, y: 20, rows: opts.leg },
    { role: 'leg-b', x: legBx, y: 20, rows: mirror(opts.leg) },
    { role: 'body', x: 4, y: 8, rows: opts.body },
    { role: 'arm-a', x: armAx, y: 8, rows: opts.arm },
    {
      role: 'arm-b',
      x: armBx,
      y: 8,
      rows: mirror(opts.arm),
      children: opts.withTool ? [PICKAXE] : undefined,
    },
    { role: 'head', x: 4, y: 0, rows: opts.head },
  ];
}

// Téo: personagem própria (cabelo arrepiado, moletom vermelho com listra, tênis branco)
const STEVE: MobDef = {
  label: 'Téo',
  view: 'front',
  width: 16,
  height: 32,
  palette: {
    H: '#2b1d14', h: '#4a3020', S: '#e0a982', s: '#c98f68', W: '#ffffff', B: '#1d1d1d', M: '#b5523b',
    T: '#d64541', t: '#a8322f', L: '#f5f5f5', P: '#34495e', p: '#283a4b', G: '#f2f2f2', g: '#c9c9c9', ...PICKAXE_COLORS,
  },
  parts: humanoid({
    head: ['.H.HH.H.', 'HHHHHHHH', 'HhHHHHhH', 'SSSSSSSS', 'SBSSSSBS', 'SSSssSSS', 'SSSMMSSS', 'SSSSSSSS'],
    body: ['TTTSSTTT', 'TTTTTTTT', 'LLLLLLLL', 'TTTTTTTT', 'TTTTTTTT', 'TTTttTTT', 'TTTTTTTT', 'TTTTTTTT', 'tTTTTTTt', 'TTTTTTTT', 'PPPPPPPP', 'PPPPPPPP'],
    arm: ['TTTT', 'TTTT', 'LLLL', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'tTTT', 'TTTT', 'SSSS', 'SSSS', 'sSSS'],
    leg: ['PPPP', 'PPPP', 'PPPP', 'pPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'GGGG', 'gGGG'],
    withTool: true,
  }),
  special: ['mine'],
};

// Lia: personagem própria (cabelo cacheado com dois coques, camiseta amarela com estrela, macacão roxo)
const ALEX: MobDef = {
  label: 'Lia',
  view: 'front',
  width: 16,
  height: 32,
  palette: {
    O: '#1f1410', o: '#3a2618', S: '#8d5a3b', s: '#7a4c31', W: '#ffffff', E: '#1d1d1d', M: '#d9607a', R: '#ff8fb1',
    G: '#f4c430', g: '#d4a514', Y: '#ffffff', N: '#7d4cc2', n: '#6339a3', D: '#f2f2f2', ...PICKAXE_COLORS,
  },
  parts: [
    // dois coques dos lados da cabeça (balançam com ela)
    ...humanoid({
      head: ['OOOOOOOO', 'OoOOOOoO', 'OSSSSSSO', 'SSSSSSSS', 'SESSSSES', 'SRSSSSRS', 'SSSMMSSS', 'SSSSSSSS'],
      body: ['GGGSSGGG', 'GGGGGGGG', 'GGGYGGGG', 'GGYYYGGG', 'GGGYGGGG', 'gGGGGGGg', 'NGGGGGGN', 'NNNNNNNN', 'NNNNNNNN', 'NNNnnNNN', 'NNNNNNNN', 'NNNNNNNN'],
      arm: ['gGGG', 'GGGG', 'GGGG', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'sSSS', 'SSSS'],
      leg: ['NNNN', 'NNNN', 'NNNN', 'nNNN', 'NNNN', 'NNNN', 'NNNN', 'NNNN', 'NNNN', 'NNNN', 'DDDD', 'DDDD'],
      withTool: true,
    }).map((part) =>
      part.role === 'head' ? { ...part, children: [{ role: 'detail' as const, x: 2, y: 0, rows: ['.OO........OO.', 'OOo........oOO', '.OO........OO.'] }] } : part
    ),
  ],
  special: ['mine'],
};

// Luna: personagem própria (cabelo comprido com laço, saia e legging)
const LUNA_PARTS = humanoid({
  head: ['HHHHHHRR', 'HHHHHHHR', 'HSSSSSSH', 'HSSSSSSH', 'HWBSSBWH', 'HSSSSSSH', 'HSSMMSSH', 'HSSSSSSH'],
  body: ['TTTSSTTT', 'TTTTTTTT', 'TTTTTTTT', 'tTTTTTTt', 'TTTTTTTT', 'TTTTTTTT', 'TTTTTTTT', 'tTTTTTTt', 'TTTTTTTT', 'KKKKKKKK', 'KKKKKKKK', 'kKKKKKKk'],
  arm: ['tTTT', 'TTTT', 'TTTT', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'sSSS', 'SSSS'],
  leg: ['PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'pPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'GGGG', 'GGGG'],
  withTool: true,
});

// Faísca: herói ORIGINAL de capa (voa e solta rajada de energia)
const FAISCA_CAPE: PartDef = {
  role: 'cape',
  x: -1,
  y: 8,
  rows: ['...kKKKKKKKKKKk...', ...Array.from({ length: 15 }, (_, r) => (r % 5 === 4 ? 'kKKKKKKKKKKKKKKKKk' : 'KKKKKKKKKKKKKKKKKK'))],
};

const FAISCA: MobDef = {
  label: 'Faísca',
  view: 'front',
  width: 16,
  height: 32,
  palette: {
    H: '#d9481c', S: '#e6b08a', s: '#cf9a74', M: '#f5f5f5', W: '#ffffff', B: '#2a6cc9', m: '#a0522d',
    T: '#14a39a', t: '#0f7d76', E: '#ffe14d', G: '#f28c28', P: '#173a5e', p: '#112c47',
    K: '#f28c28', k: '#c96d14', ...PICKAXE_COLORS,
  },
  parts: [
    FAISCA_CAPE,
    ...humanoid({
      head: ['.H.HH.H.', 'HHHHHHHH', 'HSSSSSSH', 'MMMMMMMM', 'MWBMMBWM', 'SSSSSSSS', 'SSSmmSSS', 'SSSSSSSS'],
      body: ['TTTSSTTT', 'TTTTTTTT', 'TTTEETTT', 'TTEEEETT', 'TTTEETTT', 'tTTTTTTt', 'TTTTTTTT', 'TTTTTTTT', 'TTTTTTTT', 'GGGGGGGG', 'PPPPPPPP', 'PPPPPPPP'],
      arm: ['TTTT', 'TTTT', 'tTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'GGGG', 'GGGG', 'SSSS', 'SSSS'],
      leg: ['PPPP', 'PPPP', 'PPPP', 'PPPP', 'pPPP', 'PPPP', 'PPPP', 'PPPP', 'GGGG', 'GGGG', 'GGGG', 'GGGG'],
    }),
  ],
  special: ['fly', 'power'],
};

const LUNA: MobDef = {
  label: 'Luna',
  view: 'front',
  width: 16,
  height: 32,
  palette: {
    H: '#3b2416', h: '#2a190f', R: '#ff5fa2', S: '#a86b48', s: '#935b3c', W: '#ffffff', B: '#3b2a1a', M: '#d9607a',
    T: '#8e44ad', t: '#6c3483', K: '#ff7eb6', k: '#e0609a', P: '#2d6fb7', p: '#245a95', G: '#f2f2f2', ...PICKAXE_COLORS,
  },
  parts: [
    ...LUNA_PARTS.slice(0, 3),
    // saia rodada por cima do alto das pernas
    { role: 'detail', x: 3, y: 20, rows: ['kKKKKKKKKk', '.kKKkkKKk.'] },
    ...LUNA_PARTS.slice(3, 5),
    {
      ...LUNA_PARTS[5],
      // mechas do cabelo caindo sobre os ombros (balançam com a cabeça)
      children: [{ role: 'detail', x: 4, y: 8, rows: ['H......H', 'H......H', 'h......h'] }],
    },
  ],
  special: ['mine'],
};

const ZOMBIE: MobDef = {
  label: 'Zumbi',
  view: 'front',
  width: 16,
  height: 32,
  palette: {
    G: '#9bb07f', g: '#7f9466', K: '#2b2b2b', W: '#ffffff', T: '#d9822b', t: '#b06a22',
    P: '#5b4636', p: '#4a382b', D: '#2e2e2e',
  },
  parts: humanoid({
    head: ['GgGGGgGG', 'GGGGGGGG', 'GGGGGGGG', 'GWKGGKWG', 'GGGGGGGG', 'GGGgGGGG', 'GKGKGKGG', 'GGGGGGGG'],
    body: ['TTTGGTTT', 'TTTTTTTT', 'TTtTTTTT', 'TTTTTTtT', 'TTTTTTTT', 'TtTTTTTT', 'TTTTTTTT', 'TTTT.TTT', 'TTT...TT', 'TTTTTTTT', 'PPPPPPPP', 'PPPPPPPP'],
    arm: ['TTTT', 'TTTT', 'tTTT', 'GGGG', 'GGGG', 'GgGG', 'GGGG', 'GGGG', 'GGgG', 'GGGG', 'GGGG', 'GGGG'],
    leg: ['PPPP', 'PPPP', 'PPPP', 'pPPP', 'PPPP', 'PPPP', 'PPPP', 'PPpP', 'PPPP', 'PPPP', 'DDDD', 'DDDD'],
  }),
  special: [],
};

const SKELETON: MobDef = {
  label: 'Esqueleto',
  view: 'front',
  width: 16,
  height: 32,
  palette: { L: '#d9d9d9', M: '#a8a8a8', k: '#2b2b2b' },
  parts: humanoid({
    head: ['LLLLLLLL', 'LLLLLLLL', 'LMLLLLML', 'LkkLLkkL', 'LLLLLLLL', 'LLLkkLLL', 'LMkMkMkL', 'LLLLLLLL'],
    body: ['...LL...', '.LLLLLL.', '...LL...', '.LLLLLL.', '...LL...', '.LLLLLL.', '...LL...', '...LL...', '...LL...', '..LLLL..', '..L..L..', '........'],
    arm: fill(2, 12, 'L').map((r, i) => (i % 4 === 3 ? 'LM' : r)),
    leg: fill(2, 12, 'L').map((r, i) => (i % 4 === 2 ? 'ML' : r)),
    armWidth: 2,
    legWidth: 2,
  }),
  special: [],
};

// Sombrio: sombra alta de capa estrelada, olhos amarelos e cachecol (silhueta própria: capa longa, pernas curtas)
const ENDERMAN: MobDef = {
  label: 'Sombrio',
  view: 'front',
  width: 12,
  height: 50,
  palette: { K: '#26305a', k: '#323f73', s: '#e8e8ff', Y: '#ffd23f', R: '#e85d5d', r: '#b84444', D: '#1a2140' },
  parts: [
    { role: 'leg-a', x: 3, y: 42, rows: fill(2, 8, 'D') },
    { role: 'leg-b', x: 7, y: 42, rows: fill(2, 8, 'D') },
    {
      role: 'body',
      x: 1,
      y: 10,
      rows: Array.from({ length: 33 }, (_, r) => {
        const row = r % 7 === 3 ? 'KKsKKKKsKK' : r % 7 === 6 ? 'KKKKsKKKKK' : 'KKKKKKKKKK';
        return r < 2 ? row.replace(/^K|K$/g, '.') : row;
      }),
    },
    { role: 'arm-a', x: 0, y: 12, rows: fill(1, 14, 'k') },
    { role: 'arm-b', x: 11, y: 12, rows: fill(1, 14, 'k') },
    {
      role: 'head',
      x: 2,
      y: 0,
      rows: ['..KKKK..', '.KKKKKK.', 'KKKKKKKK', 'KKKKKKKK', 'KYYKKYYK', 'KKKKKKKK', 'KKKKKKKK', 'RRRRRRRR', 'rRRRRRRr', '..RR....'],
    },
  ],
  special: ['teleport'],
};

// Morador: chapéu de palha, bigode e macacão azul (personagem própria)
const VILLAGER: MobDef = {
  label: 'Morador',
  view: 'front',
  width: 10,
  height: 30,
  palette: {
    S: '#e0b089', s: '#c9976f', K: '#1d1d1d', m: '#6b4226', Y: '#f2c94c', y: '#c9a227',
    B: '#3d6fb6', b: '#2f5a96', W: '#f5f5f5', D: '#4a3424',
  },
  parts: [
    { role: 'leg-a', x: 1, y: 24, rows: ['BBBB', 'BBBB', 'BBBB', 'bBBB', 'DDDD', 'DDDD'] },
    { role: 'leg-b', x: 5, y: 24, rows: ['BBBB', 'BBBB', 'BBBB', 'BBBb', 'DDDD', 'DDDD'] },
    {
      role: 'body',
      x: 1,
      y: 10,
      rows: ['WWWWWWWW', 'WBWWWWBW', 'WBWWWWBW', 'BBBBBBBB', 'BBBYYBBB', 'BBBBBBBB', 'BBBBBBBB', 'bBBBBBBb', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'bbbbbbbb', 'BBBBBBBB'],
    },
    { role: 'arm-a', x: 0, y: 10, rows: ['W', 'W', 'W', 'W', 'S', 'S', 'S'] },
    { role: 'arm-b', x: 9, y: 10, rows: ['W', 'W', 'W', 'W', 'S', 'S', 'S'] },
    {
      role: 'head',
      x: 1,
      y: 0,
      rows: ['.YYYYYY.', 'yYYYYYYy', 'SSSSSSSS', 'SKSSSSKS', 'SSSSSSSS', 'SSSssSSS', 'SmmmmmmS', 'SSSSSSSS', 'SSSSSSSS', 'sSSSSSSs'],
      children: [{ role: 'detail', x: 0, y: 1, rows: ['YYYYYYYYYY'] }],
    },
  ],
  special: [],
};

// Estourinho: bombinha redonda e simpática com pavio aceso (personagem própria)
const CREEPER: MobDef = {
  label: 'Estourinho',
  view: 'front',
  width: 8,
  height: 26,
  palette: {
    a: '#2b2d42', b: '#4a4e69', W: '#ffffff', k: '#151515', R: '#ff8fa3', f: '#8a5a2b', Y: '#ffd23f', O: '#ff7b25',
    c: '#f4a259', d: '#c97c3a', L: '#bc4b51', l: '#8f3a3e',
  },
  parts: [
    { role: 'leg-a', x: 1, y: 21, rows: ['LL', 'LL', 'LL', 'LL', 'll'] },
    { role: 'leg-b', x: 5, y: 21, rows: ['LL', 'LL', 'LL', 'LL', 'll'] },
    { role: 'body', x: 1, y: 13, rows: ['cccccc', 'cccccc', 'ccYYcc', 'cccccc', 'dccccd', 'cccccc', 'cccccc', 'dddddd'] },
    {
      role: 'head',
      x: 0,
      y: 4,
      rows: ['..aaaa..', '.abbaaa.', 'abaaaaaa', 'aWkaaWka', 'aWWaaWWa', 'aRaaaaRa', '.aakkaa.', '..aaaa..', '...aa...'],
      children: [{ role: 'detail', x: 3, y: 0, rows: ['.YO.', '..Y.', '..f.', '.f..'] }],
    },
  ],
  special: ['fuse'],
};

// ---------- animais (de lado, olhando para a direita) ----------

const PIG: MobDef = {
  label: 'Porco',
  view: 'side',
  scale: 1.5,
  width: 23,
  height: 13,
  palette: { p: '#f0a8a8', P: '#de8f8f', s: '#f7c6c6', n: '#a8525a', k: '#1d1d1d', w: '#ffffff', F: '#c97a7a' },
  parts: [
    { role: 'leg-b', x: 2, y: 9, rows: fill(3, 4, 'F') },
    { role: 'leg-a', x: 10, y: 9, rows: fill(3, 4, 'F') },
    { role: 'body', x: 0, y: 1, rows: mottle(14, 8, 'pppppP', 13) },
    {
      role: 'head',
      x: 13,
      y: 0,
      origin: [14, 6],
      rows: ['pppppppp..', 'pppppppp..', 'ppppwkpp..', 'pppppppp..', 'ppppppppss', 'ppppppppsn', 'ppppppppss', 'pppppppp..'],
    },
    { role: 'leg-a', x: 3, y: 9, rows: ['ppp', 'ppp', 'ppp', 'PPP'] },
    { role: 'leg-b', x: 11, y: 9, rows: ['ppp', 'ppp', 'ppp', 'PPP'] },
  ],
  special: [],
};

const SHEEP: MobDef = {
  label: 'Ovelha',
  view: 'side',
  scale: 1.5,
  width: 22,
  height: 15,
  palette: { W: '#eeeeee', w: '#d6d6d6', S: '#c9a98b', s: '#a8876a', k: '#1d1d1d', F: '#9c7d62' },
  parts: [
    { role: 'leg-b', x: 2, y: 10, rows: ['www', 'FFF', 'FFF', 'FFF', 'FFF'] },
    { role: 'leg-a', x: 10, y: 10, rows: ['www', 'FFF', 'FFF', 'FFF', 'FFF'] },
    { role: 'body', x: 0, y: 1, rows: mottle(15, 9, 'WWWw', 17) },
    {
      role: 'head',
      x: 13,
      y: 0,
      origin: [14, 6],
      rows: ['WWWWWWW..', 'WWWWWWWW.', 'WWWSSSSSS', 'WWSSSkSSS', 'WWSSSSSSS', 'WWSSSSSss', '.WWSSSSS.'],
    },
    { role: 'leg-a', x: 3, y: 10, rows: ['WWW', 'SSS', 'SSS', 'SSS', 'sss'] },
    { role: 'leg-b', x: 11, y: 10, rows: ['WWW', 'SSS', 'SSS', 'SSS', 'sss'] },
  ],
  special: [],
};

const COW: MobDef = {
  label: 'Vaca',
  view: 'side',
  scale: 1.5,
  width: 23,
  height: 15,
  palette: { B: '#4a3524', b: '#2e2117', W: '#ececec', M: '#c9a58d', m: '#8f6e5a', H: '#d8d0c0', k: '#111111', F: '#36261a' },
  parts: [
    { role: 'leg-b', x: 1, y: 11, rows: ['FFF', 'FFF', 'FFF', 'bbb'] },
    { role: 'leg-a', x: 9, y: 11, rows: ['FFF', 'FFF', 'FFF', 'bbb'] },
    {
      role: 'body',
      x: 0,
      y: 2,
      rows: [
        'BBBBWWWBBBBBBB',
        'BBBWWWWBBBBWWB',
        'BBBBWWBBBBWWWB',
        'BBBBBBBBBBBWWB',
        'WWBBBBBBBBBBBB',
        'WWWBBBBBWWBBBB',
        'WWBBBBBWWWWBBB',
        'BBBBBBBBWWBBBB',
        'BBBBBBBBBBBBBB',
      ],
    },
    {
      role: 'head',
      x: 13,
      y: 0,
      origin: [14, 7],
      rows: [
        'H.........',
        'HBBBBBBB..',
        'BBBBBBBB..',
        'BBBBWkBB..',
        'BBBBBBBB..',
        'BBBBMMMMMM',
        'BBBMMMMmMM',
        '.BBMMMMMMM',
        '..BMMMMMM.',
      ],
    },
    { role: 'leg-a', x: 2, y: 11, rows: ['BBB', 'BBB', 'WWW', 'bbb'] },
    { role: 'leg-b', x: 10, y: 11, rows: ['BBB', 'BBB', 'WWW', 'bbb'] },
  ],
  special: [],
};

const CHICKEN: MobDef = {
  label: 'Galinha',
  view: 'side',
  scale: 1.6,
  width: 12,
  height: 13,
  palette: { W: '#f4f4f4', w: '#d6d6d6', Y: '#f2b21d', R: '#d93a2a', L: '#e8a020', k: '#111111' },
  parts: [
    { role: 'leg-a', x: 2, y: 10, rows: ['.L', '.L', 'LL'] },
    { role: 'leg-b', x: 5, y: 10, rows: ['.L', '.L', 'LL'] },
    { role: 'body', x: 0, y: 4, rows: ['WW......', 'WWWWWWWW', 'WWWWWWWW', 'WWWWWWWW', 'WWWWWWWW', '.wwwwww.'] },
    { role: 'wing', x: 2, y: 5, rows: ['wwww', 'wwww', 'wwww', '.ww.'], origin: [4, 5] },
    {
      role: 'head',
      x: 6,
      y: 0,
      origin: [7, 6],
      rows: ['WWWW..', 'WWkW..', 'WWWWYY', 'WWWWYY', 'WWWWR.', 'WWWWR.'],
    },
  ],
  special: [],
};

const WOLF: MobDef = {
  label: 'Lobo',
  view: 'side',
  scale: 1.5,
  width: 22,
  height: 13,
  palette: { G: '#d9d9d9', g: '#bdbdbd', D: '#9e9e9e', k: '#222222', N: '#333333', F: '#a9a9a9' },
  parts: [
    { role: 'tail', x: 0, y: 3, origin: [2, 3], rows: ['GG', 'GG', 'gG', 'GG', 'gG', 'DG'] },
    { role: 'leg-b', x: 4, y: 9, rows: fill(2, 4, 'F') },
    { role: 'leg-a', x: 11, y: 9, rows: fill(2, 4, 'F') },
    { role: 'body', x: 2, y: 3, rows: ['GGGGGGGGGGGGG', ...mottle(13, 5, 'GGGg', 29)] },
    {
      role: 'head',
      x: 14,
      y: 0,
      origin: [15, 5],
      rows: ['.GG.....', '.GGG....', 'GGGGGG..', 'GGkGGGGG', 'GGGGGGGN', 'GGGggGGG', '.GGGG...'],
    },
    { role: 'leg-a', x: 5, y: 9, rows: ['GG', 'GG', 'GG', 'gg'] },
    { role: 'leg-b', x: 12, y: 9, rows: ['GG', 'GG', 'GG', 'gg'] },
  ],
  special: [],
};

export const MOBS: Record<MobType, MobDef> = {
  steve: STEVE,
  alex: ALEX,
  luna: LUNA,
  faisca: FAISCA,
  creeper: CREEPER,
  zombie: ZOMBIE,
  skeleton: SKELETON,
  enderman: ENDERMAN,
  pig: PIG,
  sheep: SHEEP,
  cow: COW,
  chicken: CHICKEN,
  wolf: WOLF,
  villager: VILLAGER,
};

export const MOB_TYPES = Object.keys(MOBS) as MobType[];

/** Tamanho em px. `size` é a altura que um humanoide teria; os outros mobs ficam proporcionais. */
export function getMobPixelSize(type: MobType, size: number): { width: number; height: number } {
  const def = MOBS[type];
  const scale = (size / MOB_REFERENCE_HEIGHT) * (def.scale ?? 1);
  return { width: def.width * scale, height: def.height * scale };
}

/** Ponto de giro padrão de cada parte (em unidades do viewBox). */
export function getPartOrigin(part: PartDef): [number, number] {
  if (part.origin) return part.origin;
  const w = Math.max(...part.rows.map((r) => r.length));
  const h = part.rows.length;
  switch (part.role) {
    case 'head':
    case 'body':
      return [part.x + w / 2, part.y + h];
    case 'arm-a':
    case 'arm-b':
    case 'leg-a':
    case 'leg-b':
    case 'wing':
    case 'tail':
    case 'cape':
      return [part.x + w / 2, part.y];
    default:
      return [part.x + w / 2, part.y + h / 2];
  }
}

// =============================================
// Skins do jogador (Steve/Alex): cores de roupa e chapéu — só visual
// =============================================

export type PlayerCharacter = 'steve' | 'alex' | 'luna' | 'faisca';
export type SkinSlot = 'shirt' | 'pants' | 'hat' | 'hero';

export interface PlayerSkin {
  character: PlayerCharacter;
  shirt: string;
  pants: string;
  hat: string;
  /** Traje de super-herói ('nenhum' = sem traje) */
  hero: string;
}

export interface SkinItem {
  id: string;
  slot: SkinSlot;
  name: string;
  price: number;
  /** Cores [principal, sombra] para roupa */
  colors?: [string, string];
  /** Chapéu: posição relativa ao topo-esquerdo da cabeça (x=4, y=0) */
  hat?: { dx: number; dy: number; rows: string[]; palette: Record<string, string> };
  /** Traje de super-herói (cobre camiseta e calça) */
  hero?: HeroSuit;
}

/** Traje de herói ORIGINAL (não usa personagens com marca). */
export interface HeroSuit {
  suit: [string, string];
  pants: [string, string];
  cape?: [string, string];
  mask?: string;
  /** 'olhos' = faixa nos olhos; 'ninja' = cobre a parte de baixo do rosto */
  maskStyle?: 'olhos' | 'ninja';
  emblem?: { rows: string[]; palette: Record<string, string>; dy?: number };
}

export const DEFAULT_SKIN: PlayerSkin = { character: 'steve', shirt: 'original', pants: 'original', hat: 'nenhum', hero: 'nenhum' };

export const SKIN_ITEMS: SkinItem[] = [
  // Camisetas
  { id: 'original', slot: 'shirt', name: 'Original', price: 0 },
  { id: 'camisa-vermelha', slot: 'shirt', name: 'Vermelha', price: 30, colors: ['#d63a2f', '#a82a22'] },
  { id: 'camisa-amarela', slot: 'shirt', name: 'Amarela', price: 30, colors: ['#f2c12e', '#c99a17'] },
  { id: 'camisa-roxa', slot: 'shirt', name: 'Roxa', price: 40, colors: ['#8e44ad', '#6c3483'] },
  { id: 'camisa-rosa', slot: 'shirt', name: 'Rosa', price: 40, colors: ['#ec6fa8', '#c94f87'] },
  { id: 'camisa-preta', slot: 'shirt', name: 'Preta', price: 50, colors: ['#2b2b2b', '#141414'] },
  // Calças
  { id: 'original', slot: 'pants', name: 'Original', price: 0 },
  { id: 'calca-verde', slot: 'pants', name: 'Verde', price: 25, colors: ['#3f8f3a', '#2f6e2b'] },
  { id: 'calca-cinza', slot: 'pants', name: 'Cinza', price: 25, colors: ['#6e6e6e', '#555555'] },
  { id: 'calca-laranja', slot: 'pants', name: 'Laranja', price: 35, colors: ['#e07b24', '#b8611a'] },
  // Chapéus
  { id: 'nenhum', slot: 'hat', name: 'Sem chapéu', price: 0 },
  {
    id: 'bone',
    slot: 'hat',
    name: 'Boné',
    price: 60,
    hat: { dx: -1, dy: -2, rows: ['..RRRRRR..', '.RRRRRRRR.', 'rrrrrrrrrr'], palette: { R: '#d63a2f', r: '#8f2219' } },
  },
  {
    id: 'capacete',
    slot: 'hat',
    name: 'Capacete de minerador',
    price: 80,
    hat: { dx: -1, dy: -2, rows: ['..YYYYYY..', '.YYYWWYYY.', 'yyyyyyyyyy'], palette: { Y: '#f2c12e', y: '#c99a17', W: '#fffbd1' } },
  },
  {
    id: 'mago',
    slot: 'hat',
    name: 'Chapéu de mago',
    price: 100,
    hat: {
      dx: -1,
      dy: -7,
      rows: ['....PP....', '...PPP....', '...PPYP...', '..PPPPP...', '..PPPPPP..', '.PPPPPPPP.', 'pppppppppp'],
      palette: { P: '#6c3fb5', p: '#4a2a80', Y: '#ffd23f' },
    },
  },
  // Super-heróis (originais, sem marcas registradas)
  { id: 'nenhum', slot: 'hero', name: 'Sem traje', price: 0 },
  {
    id: 'relampago', slot: 'hero', name: 'Herói Relâmpago', price: 150,
    hero: { suit: ['#2457d6', '#1a3f9e'], pants: ['#1a3f9e', '#132f77'], cape: ['#f2c12e', '#c99a17'], mask: '#1a1a2e', emblem: { rows: ['..Y', '.Y.', 'YYY', '.Y.', 'Y..'], palette: { Y: '#ffe14d' } } },
  },
  {
    id: 'estelar', slot: 'hero', name: 'Heroína Estelar', price: 150,
    hero: { suit: ['#e0499a', '#b8327a'], pants: ['#7b2fb5', '#5e2390'], cape: ['#7b2fb5', '#5e2390'], mask: '#ffffff', emblem: { rows: ['.Y.', 'YYY', 'Y.Y'], palette: { Y: '#ffd23f' } } },
  },
  {
    id: 'esmeralda', slot: 'hero', name: 'Guardiã Esmeralda', price: 180,
    hero: { suit: ['#1f9e5a', '#167a45'], pants: ['#14532d', '#0e3d21'], cape: ['#e8e8e8', '#bdbdbd'], mask: '#14532d', emblem: { rows: ['.D.', 'DDD', '.D.'], palette: { D: '#4AEDD9' } } },
  },
  {
    id: 'sombra', slot: 'hero', name: 'Ninja Sombra', price: 180,
    hero: { suit: ['#2b2b2b', '#151515'], pants: ['#2b2b2b', '#151515'], mask: '#151515', maskStyle: 'ninja', emblem: { rows: ['RRRRRRRR'], palette: { R: '#d63a2f' }, dy: 7 } },
  },
  {
    id: 'chama', slot: 'hero', name: 'Chama Veloz', price: 200,
    hero: { suit: ['#e5531a', '#b33d10'], pants: ['#7a1f0a', '#5c1707'], cape: ['#ffd23f', '#e0a800'], mask: '#7a1f0a', emblem: { rows: ['.Y.', 'YYY', 'YRY'], palette: { Y: '#ffd23f', R: '#d63a2f' } } },
  },
  {
    id: 'gelo', slot: 'hero', name: 'Cristal de Gelo', price: 200,
    hero: { suit: ['#3aa7c9', '#2a87a6'], pants: ['#e8f7ff', '#bfe6f5'], cape: ['#ffffff', '#d6eef7'], mask: '#1d6f8f', emblem: { rows: ['W.W', '.W.', 'W.W'], palette: { W: '#ffffff' } } },
  },
  {
    id: 'lunar', slot: 'hero', name: 'Sentinela Lunar', price: 220,
    hero: { suit: ['#2b3a67', '#1d2747'], pants: ['#1d2747', '#141b33'], cape: ['#9aa5b1', '#6b7785'], mask: '#9aa5b1', emblem: { rows: ['WW.', 'W..', 'WW.'], palette: { W: '#f4f4f4' } } },
  },
  {
    id: 'cometa', slot: 'hero', name: 'Capitão Cometa', price: 220,
    hero: { suit: ['#f5f5f5', '#cfcfcf'], pants: ['#1fa3a3', '#167a7a'], cape: ['#1fa3a3', '#167a7a'], mask: '#1fa3a3', emblem: { rows: ['..O', '.O.', 'OO.'], palette: { O: '#ff8c1a' } } },
  },
  {
    id: 'fera', slot: 'hero', name: 'Fera Listrada', price: 250,
    hero: { suit: ['#f08a24', '#c96d14'], pants: ['#1a1a1a', '#0d0d0d'], mask: '#1a1a1a', emblem: { rows: ['K.K.K', 'K.K.K', '.....', 'K.K.K'], palette: { K: '#1a1a1a' } } },
  },
  {
    id: 'coroa',
    slot: 'hat',
    name: 'Coroa',
    price: 150,
    hat: { dx: 0, dy: -3, rows: ['Y..YY..Y', 'YYYYYYYY', 'YRYYBYRY'], palette: { Y: '#ffd700', R: '#d63a2f', B: '#3f76e4' } },
  },
];

export function getSkinItem(slot: SkinSlot, id: string): SkinItem | undefined {
  return SKIN_ITEMS.find((i) => i.slot === slot && i.id === id);
}

// Letras da paleta de cada personagem: [roupa principal, roupa sombra]
const SKIN_KEYS: Record<PlayerCharacter, Record<'shirt' | 'pants', [string, string]>> = {
  steve: { shirt: ['T', 't'], pants: ['P', 'p'] },
  alex: { shirt: ['G', 'g'], pants: ['N', 'n'] },
  luna: { shirt: ['T', 't'], pants: ['P', 'p'] },
  faisca: { shirt: ['T', 't'], pants: ['P', 'p'] },
};

const isPlayer = (t: MobType): t is PlayerCharacter => t === 'steve' || t === 'alex' || t === 'luna' || t === 'faisca';

/** Aplica a skin no desenho do Steve/Alex/Luna (outros mobs não mudam). */
export function applySkin(type: MobType, skin: PlayerSkin | undefined): MobDef {
  const def = MOBS[type];
  if (!skin || !isPlayer(type)) return def;

  const palette = { ...def.palette };
  const hero = getSkinItem('hero', skin.hero ?? 'nenhum')?.hero;

  // Roupa: o traje de herói cobre camiseta e calça
  for (const slot of ['shirt', 'pants'] as const) {
    const colors = hero ? (slot === 'shirt' ? hero.suit : hero.pants) : getSkinItem(slot, skin[slot])?.colors;
    if (colors) {
      const [main, dark] = SKIN_KEYS[type][slot];
      palette[main] = colors[0];
      palette[dark] = colors[1];
    }
  }

  // Luna: com traje de herói, a saia vira parte do uniforme
  if (hero && type === 'luna') {
    palette.K = hero.pants[0];
    palette.k = hero.pants[1];
  }

  // Cores extras (chapéu, capa, máscara, emblema) ganham símbolos próprios para não colidir com a paleta do mob
  const symbols = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫'.split('');
  let next = 0;
  const addColors = (pal: Record<string, string>) => {
    const remap: Record<string, string> = {};
    for (const [k, color] of Object.entries(pal)) {
      const sym = symbols[next++];
      remap[k] = sym;
      palette[sym] = color;
    }
    return (rows: string[]) => rows.map((r) => r.replace(/[^.]/g, (c) => remap[c] ?? '.'));
  };

  const headExtras: PartDef[] = [];
  const bodyExtras: PartDef[] = [];
  const behind: PartDef[] = [];
  const head = def.parts.find((p) => p.role === 'head')!;
  const body = def.parts.find((p) => p.role === 'body')!;

  if (hero) {
    if (hero.cape) {
      const map = addColors({ C: hero.cape[0], c: hero.cape[1] });
      const rows = Array.from({ length: 15 }, (_, r) => (r === 0 ? '...cCCCCCCCCCCc...' : 'cCCCCCCCCCCCCCCCCc'));
      // capa atrás de tudo, aparecendo dos lados e embaixo
      behind.push({ role: 'detail', x: -1, y: 8, rows: map(rows) });
    }
    if (hero.mask) {
      const map = addColors({ M: hero.mask });
      const rows = hero.maskStyle === 'ninja' ? ['MMMMMMMM', 'MMMMMMMM', 'MMMMMMMM'] : ['MMMMMMMM', 'M..MM..M'];
      headExtras.push({ role: 'detail', x: head.x, y: head.y + (hero.maskStyle === 'ninja' ? 5 : 3), rows: map(rows) });
    }
    if (hero.emblem) {
      const map = addColors(hero.emblem.palette);
      const w = Math.max(...hero.emblem.rows.map((r) => r.length));
      bodyExtras.push({ role: 'detail', x: body.x + Math.floor((8 - w) / 2), y: body.y + (hero.emblem.dy ?? 2), rows: map(hero.emblem.rows) });
    }
  }

  const hat = getSkinItem('hat', skin.hat)?.hat;
  if (hat) {
    const map = addColors(hat.palette);
    // O chapéu é filho da cabeça, então balança junto com ela
    headExtras.push({ role: 'detail', x: head.x + hat.dx, y: head.y + hat.dy, rows: map(hat.rows) });
  }

  const parts = [
    ...behind,
    ...def.parts.map((part) => {
      if (part.role === 'head' && headExtras.length) return { ...part, children: [...(part.children ?? []), ...headExtras] };
      if (part.role === 'body' && bodyExtras.length) return { ...part, children: [...(part.children ?? []), ...bodyExtras] };
      return part;
    }),
  ];
  return { ...def, palette, parts };
}
