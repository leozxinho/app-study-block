import type { PixelSprite } from '../activities/shared/pixelSprites';
import { spriteForEmoji } from '../activities/shared/itemSprites';

/**
 * Ícones em pixel art da landing (no lugar dos emojis, que mudam de desenho em cada aparelho).
 * Chave = o emoji que o ícone substitui. '.' é transparente.
 */
const sp = (name: string, rows: string, palette: Record<string, string>): PixelSprite => ({
  name,
  rows: rows.trim().split('\n').map((r) => r.trim()),
  palette,
});

const SKIN = '#f2c49b';
const INK = '#2b2b2b';

export const LANDING_ICONS: Record<string, PixelSprite> = {
  '👨‍👧': sp('Responsável e criança', `
    .hhh......
    .sss......
    .sss...hh.
    ..s....ss.
    BBBBB..ss.
    BBBBB.PPPP
    BBBBB.PPPP
    .B.B..PPPP
    .B.B...P.P
    .B.B...P.P`, { h: '#5b3a1e', s: SKIN, B: '#2f6fdb', P: '#e85d9a' }),
  '🗺️': sp('Mapa', `
    pPPPpPPPpP
    PBBGGBBBBP
    PBGGGGBBGP
    PBBGGBBGGP
    PBBBBBBGGP
    PBGGBRBRBP
    PGGGBBRBBP
    PGGBBRBRBP
    PBBBBBBBBP
    pPPPpPPPpP`, { P: '#e9d8a6', p: '#c9b27a', B: '#5aa9e6', G: '#4e8a3a', R: '#e5484d' }),
  '📊': sp('Gráfico', `
    kWWWWWWWWW
    kWWWWWWBBW
    kWWWWWWBBW
    kWWWGGWBBW
    kWWWGGWBBW
    kWRRGGWBBW
    kWRRGGWBBW
    kWRRGGWBBW
    kkkkkkkkkk
    ..........`, { k: INK, W: '#ffffff', R: '#e5484d', G: '#2fbf71', B: '#2f6fdb' }),
  '🔊': sp('Som', `
    ..........
    ....k...b.
    ...kk..b..
    kkkkk.b..b
    kKKkk.b.b.
    kKKkk.b.b.
    kkkkk.b..b
    ...kk..b..
    ....k...b.
    ..........`, { k: '#474c54', K: '#7a7f87', b: '#2f6fdb' }),
  '➕': sp('Mais', `
    ..........
    ...GGGG...
    ...GggG...
    GGGGggGGGG
    GggggggggG
    GggggggggG
    GGGGggGGGG
    ...GggG...
    ...GGGG...
    ..........`, { G: '#2f5e22', g: '#4e8a3a' }),
  '🏆': sp('Troféu', `
    .YYYYYYYY.
    YYwYYYYyYY
    Y.YwYYYy.Y
    Y.YYYYYy.Y
    .YYYYYYY..
    ..YYYYyy..
    ....yy....
    ....yy....
    ...BBBB...
    ..BBBBBB..`, { Y: '#ffc83d', y: '#d99a00', w: '#fff1a6', B: '#8b5a2b' }),
  '🎯': sp('Alvo', `
    ...RRRR...
    ..RWWWWR..
    .RWRRRRWR.
    RWRWWWWRWR
    RWRWRRWRWR
    RWRWRRWRWR
    RWRWWWWRWR
    .RWRRRRWR.
    ..RWWWWR..
    ...RRRR...`, { R: '#e5484d', W: '#ffffff' }),
  '🚫': sp('Proibido', `
    ...RRRR...
    .RRWWWWRR.
    .RWWWWRRR.
    RWWWWRRWWR
    RWWWRRWWWR
    RWWRRWWWWR
    RWRRWWWWWR
    .RRRWWWWR.
    .RRWWWWRR.
    ...RRRR...`, { R: '#e5484d', W: '#ffffff' }),
  '🔐': sp('Cadeado', `
    ...SSSS...
    ..SS..SS..
    ..S....S..
    ..S....S..
    .YYYYYYYY.
    .YYYYYYYY.
    .YYYkkYYY.
    .YYYkkYYY.
    .YYYYkYYY.
    .yyyyyyyy.`, { S: '#7a7f87', Y: '#ffc83d', y: '#d99a00', k: INK }),
  '⏱️': sp('Relógio', `
    ....kk....
    ...kkkk...
    ..kkkkkk..
    .kWWWWWWk.
    kWWWRWWWWk
    kWWWRWWWWk
    kWWWRRRWWk
    kWWWWWWWWk
    .kWWWWWWk.
    ..kkkkkk..`, { k: '#474c54', W: '#ffffff', R: '#e5484d' }),
  '🍼': sp('Mamadeira', `
    ....NN....
    ....NN....
    ...WWWW...
    ...bbbb...
    ..WWWWWW..
    ..WllllW..
    ..WllllW..
    ..WllllW..
    ..WllllW..
    ...WWWW...`, { N: '#ff9f43', W: '#ffffff', b: '#2f6fdb', l: '#bfe3ff' }),
  '🧸': sp('Ursinho', `
    .bb....bb.
    bllbbbbllb
    .bbbbbbbb.
    .bkbbbbkb.
    .bbbllbbb.
    ..bbkkbb..
    .bbbbbbbb.
    bbbllllbbb
    bbbllllbbb
    .bb....bb.`, { b: '#a0662f', l: '#e0b07a', k: INK }),
  '🎨': sp('Paleta', `
    ..PPPPP...
    .PPRPPPP..
    PPPPPPBPP.
    PYPPPPPPPP
    PPPP..PPPP
    PGPP..PPP.
    PPPPPPP...
    .PPPPOPP..
    ..PPPPPP..
    ...PPPP...`, { P: '#e9c98f', R: '#e5484d', B: '#2f6fdb', Y: '#ffc83d', G: '#2fbf71', O: '#ff8c1a' }),
  '📚': sp('Livros', `
    ..........
    .RRRRRRRWW
    .RRRRRRRWW
    .rrrrrrrrr
    GGGGGGGGW.
    GGGGGGGGW.
    gggggggggg
    .BBBBBBBWW
    .BBBBBBBWW
    .bbbbbbbbb`, { R: '#e5484d', r: '#a8282d', G: '#2fbf71', g: '#1f8a50', B: '#2f6fdb', b: '#1d4a99', W: '#ffffff' }),
  '✏️': sp('Lápis', `
    ........PP
    .......PPP
    ......YYP.
    .....YYY..
    ....YYY...
    ...YYY....
    ..YYY.....
    .wwY......
    .kw.......
    k.........`, { P: '#ff8fb1', Y: '#ffc83d', w: '#e9c98f', k: INK }),
  '🎒': sp('Mochila', `
    ...kkkk...
    ..k....k..
    .RRRRRRRR.
    RRRRRRRRRR
    RRrrrrrrRR
    RRrYYYYrRR
    RRrrrrrrRR
    RRRRRRRRRR
    RRRRRRRRRR
    .RRRRRRRR.`, { k: '#474c54', R: '#e5484d', r: '#a8282d', Y: '#ffc83d' }),
};

/** Ícone em pixel do emoji (os da landing ou os itens do jogo); null = não tem desenho. */
export function landingSprite(emoji: string): PixelSprite | null {
  return LANDING_ICONS[emoji] ?? LANDING_ICONS[`${emoji}️`] ?? spriteForEmoji(emoji);
}
