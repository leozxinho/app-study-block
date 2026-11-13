import type { PixelSprite } from './pixelSprites';

/**
 * Itens desenhados em pixel art (estilo próprio, no lugar dos emojis do aparelho).
 * Chave = o emoji que o item substitui. Use ItemArt para desenhar.
 */
const sp = (name: string, rows: string, palette: Record<string, string>): PixelSprite => ({
  name,
  rows: rows.trim().split('\n').map((r) => r.trim()),
  palette,
});

export const ITEM_SPRITES: Record<string, PixelSprite> = {
  '🔥': sp('Fogo', `
    ....r.....
    ...rr..r..
    ..rorr.rr.
    ..roorrro.
    .rooyoorr.
    .royyyoor.
    .royyyyor.
    .rroyyorr.
    ..rrooorr.
    ...rrrrr..`, { r: '#d62d20', o: '#ff8c1a', y: '#ffe14d' }),
  '🟧': sp('Magma', `
    DDODDDOD
    DOOODOOD
    OOYOOOYO
    DOOODOOO
    DDODDYOD
    ODOOOOOD
    OOYODOOO
    DDOODDOD`, { D: '#4a1a0a', O: '#c2410c', Y: '#ffb020' }),
  '🌀': sp('Portal', `
    OOOOOOOOOO
    OPpPPpPpPO
    OPPpLPPpPO
    OpPPPLpPPO
    OPPpPPLPpO
    OpPLPPpPPO
    OPPPpPPpPO
    OpPpPPpPLO
    OPPPpLPPpO
    OOOOOOOOOO`, { O: '#24123a', P: '#8a2be2', p: '#b366ff', L: '#e0b3ff' }),
  '❄': sp('Floco de neve', `
    ....W....
    .W..W..W.
    ..W.W.W..
    ...WWW...
    WWWWLWWWW
    ...WWW...
    ..W.W.W..
    .W..W..W.
    ....W....`, { W: '#5fb4f0', L: '#ffffff' }),
  '⭐': sp('Estrela', `
    ....Y....
    ....Y....
    ...YYY...
    YYYYyYYYY
    .YYyyyYY.
    ..YyyyY..
    ..YY.YY..
    .YY...YY.
    .Y.....Y.`, { Y: '#f5b400', y: '#fff27a' }),
  '💚': sp('Esmeralda', `
    ..GGGG..
    .GgGGgG.
    GgGLLGgG
    GGLLGGGG
    GGGGGGgG
    .GGGGgG.
    ..GGgG..
    ...GG...`, { G: '#17dd62', g: '#0b9e3f', L: '#b6ffd2' }),
  '🔮': sp('Cristal', `
    ..PPPP..
    .PpPPpP.
    PpPLLPpP
    PPLLPPPP
    PPPPPPpP
    .PPPPpP.
    ..PPpP..
    ...PP...`, { P: '#a855f7', p: '#6b21a8', L: '#f0d9ff' }),
  '🐟': sp('Peixe', `
    ...BBBB...
    ..BBBBBB.B
    .BWkBBBBBB
    BBBBBBBBB.
    .BBbbbBBBB
    ..BBBBBB.B
    ...BBBB...`, { B: '#3b82c4', b: '#9fd3ff', W: '#ffffff', k: '#111111' }),
  '🌳': sp('Árvore', `
    ...LLLL...
    ..LLlLLL..
    .LLLLLlLL.
    .LlLLLLLL.
    LLLLLlLLLL
    .LLLLLLlL.
    ..LLLLLL..
    ....TT....
    ....TT....
    ...TTTT...`, { L: '#3f8f2f', l: '#6fd14f', T: '#7a4e2a' }),
  '🌸': sp('Flor', `
    ...PPP...
    ..PpppP..
    PPPpYpPPP
    PppYYYppP
    PPPpYpPPP
    ..PpppP..
    ...PSP...
    ..S.S....
    ....S....`, { P: '#ff5fa2', p: '#ffb3d4', Y: '#ffd21f', S: '#3f8f2f' }),
  '🦋': sp('Borboleta', `
    BB.......BB
    BbB.....BbB
    BbbB.k.BbbB
    BbbbBkBbbbB
    .BBbBkBbBB.
    .BbbBkBbbB.
    .BbB.k.BbB.
    ..B.....B..`, { B: '#ff8a1f', b: '#ffd27a', k: '#222222' }),
  '🍄': sp('Cogumelo', `
    ..RRRRR..
    .RRWRRRR.
    RRRRRRWRR
    RWRRRRRRR
    RRRRWRRRR
    ...SSS...
    ...SSS...
    ...SSS...
    ..SSSSS..`, { R: '#d62d20', W: '#ffffff', S: '#e9d8b8' }),
  '🐚': sp('Concha', `
    ....P....
    ...PpP...
    ..PpPpP..
    .PpPpPpP.
    PpPpPpPpP
    PpPpPpPpP
    .PPPPPPP.
    ..PP.PP..`, { P: '#f08ca0', p: '#fde2e7' }),
  '🐧': sp('Pinguim', `
    ..KKKK..
    .KKKKKK.
    .KWKKWK.
    .KKOOKK.
    KKWWWWKK
    KKWWWWKK
    .KWWWWK.
    .KWWWWK.
    ..WWWW..
    .OO..OO.`, { K: '#1f2430', W: '#ffffff', O: '#ff9f1a' }),
  '🌵': sp('Cacto', `
    ...GG...
    ..GgGG..
    ..GGgG..
    G.GGGG.G
    GGGgGGGG
    .GGGGGG.
    ..GgGG..
    ..GGGG..
    ..GGgG..
    .YYYYYY.`, { G: '#2f8a2f', g: '#6fd16f', Y: '#d8bd6c' }),
  '🔺': sp('Pirâmide', `
    ....YY....
    ...YYYy...
    ..YYYYyy..
    ..YYYYYyy.
    .YYYYYYyyy
    YYYYYYYyyy
    YYYYYYYYyy`, { Y: '#e8c26a', y: '#b8902e' }),
  '🏠': sp('Casa', `
    ....RR....
    ...RRRR...
    ..RRRRRR..
    .RRRRRRRR.
    RRRRRRRRRR
    .WWWWWWWW.
    .WBBWWDDW.
    .WBBWWDDW.
    .WWWWWDDW.
    .WWWWWDDW.`, { R: '#b8402f', W: '#d9b382', B: '#7fd3ff', D: '#6b4426' }),
  '🏰': sp('Torre', `
    S.S....S.S
    SSS....SSS
    SSS.SS.SSS
    SSSSSSSSSS
    SsSSSSSSsS
    SSSSkkSSSS
    SSSkkkkSSS
    SsSkkkkSsS
    SSSkkkkSSS
    SSSkkkkSSS`, { S: '#9a9a9a', s: '#6f6f6f', k: '#3a2a1a' }),
  '🚩': sp('Bandeira', `
    PRRRRRR..
    PRRRRRRR.
    PRRRRRRRR
    PRRRRRRR.
    PRRRRRR..
    P........
    P........
    P........
    P........
    PP.......`, { P: '#6b4426', R: '#e0322a' }),
  '⚔': sp('Espada', `
    ........W
    .......Wl
    ......Wl.
    .....Wl..
    .T..Wl...
    ..TWl....
    ...T.....
    ..H.T....
    .H.......`, { W: '#d9e6ee', l: '#7f98aa', T: '#c9a227', H: '#6b4426' }),
  '🧪': sp('Poção', `
    ...CC...
    ...GG...
    ...GG...
    ..GGGG..
    .GPPPPG.
    GPPpPPPG
    GPPPPpPG
    GPpPPPPG
    .GPPPPG.
    ..GGGG..`, { C: '#8b5a2b', G: '#bcdcf5', P: '#c13cff', p: '#f0a6ff' }),
  '💰': sp('Tesouro', `
    ...KKK...
    ....K....
    ...YYY...
    ..YYYYY..
    .YYyYYYY.
    YYYYYDYYY
    YYYYYYYyY
    YYyYYYYYY
    .YYYYYYY.`, { Y: '#c9a227', y: '#ffe066', K: '#6b4426', D: '#8a6d10' }),
  '💡': sp('Luz', `
    ..YYYY..
    .YyyyyY.
    YyyWyyyY
    YyyyyyyY
    YyyyyyyY
    .YyyyyY.
    ..YYYY..
    ..GGGG..
    ..gggg..
    ...GG...`, { Y: '#f5c518', y: '#ffef8a', W: '#ffffff', G: '#9a9a9a', g: '#6b6b6b' }),
  '📦': sp('Caixa', `
    DDDDDDDD
    DLLLLLLD
    DLDLLDLD
    DLLDDLLD
    DLLDDLLD
    DLDLLDLD
    DLLLLLLD
    DDDDDDDD`, { D: '#6b4426', L: '#b07b45' }),
  '⛄': sp('Boneco de neve', `
    ..KKKK..
    ..KKKK..
    .KKKKKK.
    .oWWWWo.
    .okWWko.
    .oWOOWo.
    ..oWWo..
    .oWWWWo.
    oWWkWWwo
    oWWWWWwo
    oWWkWWwo
    .oooooo.`, { K: '#222222', W: '#ffffff', w: '#c4dbee', k: '#222222', O: '#ff8c1a', o: '#6f8fae' }),
  '⚪': sp('Bola de neve', `
    ..oooo..
    .oWWWWo.
    oWWWWwWo
    oWWWWWwo
    oWWWWwWo
    oWwWWwwo
    .owwwwo.
    ..oooo..`, { W: '#ffffff', w: '#c4dbee', o: '#6f8fae' }),
};

/** Sprite do emoji (ignora o seletor de variação ️). */
export function spriteForEmoji(emoji: string | undefined): PixelSprite | null {
  if (!emoji) return null;
  return ITEM_SPRITES[emoji.replace(/️/g, '')] ?? null;
}
