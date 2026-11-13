// Sprites pixel-art próprios (blocos, itens e ferramentas) para as atividades.
// Cada caractere é uma cor da paleta; '.' é transparente.

export interface PixelSprite {
  name: string;
  rows: string[];
  palette: Record<string, string>;
}

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

// ---------- blocos ----------

export type BlockKind = 'grama' | 'pedra' | 'tabua' | 'ouro' | 'diamante' | 'esmeralda' | 'redstone';

export const BLOCKS: Record<BlockKind, PixelSprite> = {
  grama: {
    name: 'Grama',
    rows: ['GGGGGGGG', 'GgGGGgGG', 'gDgGDgDg', ...mottle(8, 5, 'DDDd', 3)],
    palette: { G: '#5D8C3E', g: '#4c7a31', D: '#9B7653', d: '#7d5c3e' },
  },
  pedra: {
    name: 'Pedra',
    rows: mottle(8, 8, 'SSSsd', 7),
    palette: { S: '#8a8a8a', s: '#a3a3a3', d: '#6b6b6b' },
  },
  tabua: {
    name: 'Tábua',
    rows: ['PPPPPPPP', 'PPPpPPPP', 'pppppppp', 'PPPPPPpP', 'PPPPPPPP', 'pppppppp', 'PpPPPPPP', 'PPPPPPPP'],
    palette: { P: '#BC9862', p: '#8f6c3c' },
  },
  ouro: {
    name: 'Ouro',
    rows: mottle(8, 8, 'YYYyw', 11),
    palette: { Y: '#f5c518', y: '#d9a400', w: '#fff1a6' },
  },
  diamante: {
    name: 'Diamante',
    rows: mottle(8, 8, 'CCCcw', 13),
    palette: { C: '#4AEDD9', c: '#22b8a6', w: '#c9fff8' },
  },
  esmeralda: {
    name: 'Esmeralda',
    rows: mottle(8, 8, 'EEEew', 19),
    palette: { E: '#17dd62', e: '#0b9e3f', w: '#b6ffd2' },
  },
  redstone: {
    name: 'Redstone',
    rows: mottle(8, 8, 'RRRrd', 17),
    palette: { R: '#d6261b', r: '#a31810', d: '#ff6b5e' },
  },
};

// ---------- itens de fabricação ----------

export type ItemKind = 'tabua' | 'pedra' | 'graveto' | 'carvao';

const WOOD = { w: '#8b5a2b', d: '#5c3a1a' };

export const ITEMS: Record<ItemKind, PixelSprite> = {
  tabua: BLOCKS.tabua,
  pedra: BLOCKS.pedra,
  graveto: {
    name: 'Graveto',
    rows: ['......wd', '.....wd.', '....wd..', '...wd...', '..wd....', '.wd.....', 'wd......', '........'],
    palette: WOOD,
  },
  carvao: {
    name: 'Carvão',
    rows: ['........', '..kkk...', '.kKkkk..', '.kkkKkk.', '.kKkkkk.', '..kkkK..', '...kk...', '........'],
    palette: { k: '#2c2c2c', K: '#5a5a5a' },
  },
};

// ---------- ferramentas (resultado da receita) ----------

export type ToolKind =
  | 'graveto'
  | 'mesa'
  | 'tocha'
  | 'espada'
  | 'pa'
  | 'picareta'
  | 'machado';

/** C = cabeça da ferramenta (troca de cor conforme o material). */
function tool(name: string, rows: string[], head: 'pedra' | 'madeira'): PixelSprite {
  const C = head === 'pedra' ? { C: '#9e9e9e', c: '#6f6f6f' } : { C: '#BC9862', c: '#8f6c3c' };
  return { name, rows, palette: { ...WOOD, ...C } };
}

export function getToolSprite(kind: ToolKind, material: 'pedra' | 'madeira'): PixelSprite {
  switch (kind) {
    case 'graveto':
      return ITEMS.graveto;
    case 'mesa':
      return {
        name: 'Mesa de trabalho',
        rows: ['BBBBBBBB', 'BbBBbBBb', 'BBBBBBBB', 'PPPPPPPP', 'PkPPPPwP', 'PkkPPwPP', 'PPPPPPPP', 'pPPPPPPp'],
        palette: { B: '#c08a4a', b: '#7a4f22', P: '#a8743a', p: '#6b4520', k: '#8a8a8a', w: '#5c3a1a' },
      };
    case 'tocha':
      return {
        name: 'Tocha',
        rows: ['...yy...', '...oy...', '...kk...', '...wd...', '...wd...', '...wd...', '...wd...', '...wd...'],
        palette: { ...WOOD, y: '#ffd23f', o: '#ff8c1a', k: '#3a3a3a' },
      };
    case 'espada':
      return tool('Espada', ['......CC', '.....CcC', '....CcC.', '.d.CcC..', '..dcC...', '..wd....', '.w..d...', 'w.......'], material);
    case 'pa':
      return tool('Pá', ['.....CC.', '....CCCC', '.....CC.', '....w...', '...w....', '..w.....', '.w......', 'w.......'], material);
    case 'picareta':
      return tool('Picareta', ['.CCCCC..', '......C.', '.....wC.', '....w..C', '...w....', '..w.....', '.w......', 'w.......'], material);
    case 'machado':
      return tool('Machado', ['....CC..', '...CCCw.', '...CCw..', '....w...', '...w....', '..w.....', '.w......', 'w.......'], material);
  }
}

