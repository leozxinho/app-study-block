/** Blocos da casinha: cada um libera com um número de figurinhas (fases concluídas). */
export interface HouseBlock {
  id: string;
  name: string;
  /** Cor de fundo (CSS) e detalhe opcional por cima */
  color: string;
  detail?: string;
  unlockAt: number;
}

export const HOUSE_BLOCKS: HouseBlock[] = [
  { id: 'grama', name: 'Grama', color: 'linear-gradient(#5d9e37 30%, #8b5a2b 30%)', unlockAt: 0 },
  { id: 'terra', name: 'Terra', color: '#8b5a2b', unlockAt: 0 },
  { id: 'pedra', name: 'Pedra', color: '#8a8a8a', unlockAt: 0 },
  { id: 'madeira', name: 'Madeira', color: 'repeating-linear-gradient(90deg, #b07b45 0 6px, #9a6a3a 6px 8px)', unlockAt: 3 },
  { id: 'tijolo', name: 'Tijolo', color: 'repeating-linear-gradient(0deg, #a5442f 0 7px, #d8c8b8 7px 8px)', unlockAt: 6 },
  { id: 'vidro', name: 'Vidro', color: 'linear-gradient(135deg, #cdeffd 40%, #ffffff 50%, #cdeffd 60%)', unlockAt: 10 },
  { id: 'folhas', name: 'Folhas', color: 'radial-gradient(circle, #3f8f2f 40%, #2e6b22 41%)', unlockAt: 15 },
  { id: 'flor', name: 'Flor', color: '#5d9e37', detail: '🌷', unlockAt: 20 },
  { id: 'tocha', name: 'Tocha', color: 'transparent', detail: '🔥', unlockAt: 25 },
  { id: 'ouro', name: 'Ouro', color: 'linear-gradient(135deg, #f6d32d, #e5a50a)', unlockAt: 35 },
  { id: 'diamante', name: 'Diamante', color: 'linear-gradient(135deg, #7ee8e0, #2ec4b6)', unlockAt: 50 },
  { id: 'tesouro', name: 'Baú', color: '#9a6a3a', detail: '📦', unlockAt: 70 },
];

export const HOUSE_COLS = 12;
export const HOUSE_ROWS = 8;
