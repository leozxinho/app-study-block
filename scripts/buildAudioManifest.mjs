/**
 * Gera public/audio/manifest.json: quais arquivos de áudio existem e qual fala é de cada texto.
 *   npm run audio
 * Rodar sempre que colocar ou tirar arquivos em public/audio (o build também roda).
 * Sem nenhum arquivo, não gera o índice (o jogo usa os sons sintetizados e a voz do aparelho).
 *
 * Falas fixas (mascote, contagem, chefes): src/lib/audio/voiceLines.json  { file, text }
 *   "text" = o que o jogo fala, sem emojis (igual ao texto passado para speak()).
 * Perguntas das atividades: docs/audio/falas-perguntas.csv e variações das rodadas:
 * docs/audio/falas-rodadas.csv (os dois gerados por scripts/exportVoiceLines.ts).
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = 'public/audio';
const OUT = join(ROOT, 'manifest.json');
const AUDIO = /\.(mp3|ogg|m4a|wav)$/i;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return AUDIO.test(name) ? [relative(ROOT, full).split(sep).join('/')] : [];
  });
}

const files = walk(ROOT).sort();
if (files.length === 0) {
  if (existsSync(OUT)) rmSync(OUT);
  console.log('Nenhum áudio em public/audio: sem índice (o jogo usa os sons sintetizados).');
  process.exit(0);
}
const available = new Set(files);

/** texto falado → arquivo (só os que existem) */
const lines = {};
const fixed = JSON.parse(readFileSync('src/lib/audio/voiceLines.json', 'utf8'));
for (const { file, text } of fixed) if (available.has(file)) lines[text] = file;

/** Lê um CSV com separador ";" e aspas (campos com "" dentro). */
function readCsv(path) {
  const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ';') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// Perguntas (texto_falado) e variações das rodadas (texto_original = texto que o jogo mostra)
for (const [path, column] of [
  ['docs/audio/falas-perguntas.csv', 'texto_falado'],
  ['docs/audio/falas-rodadas.csv', 'texto_original'],
]) {
  if (!existsSync(path)) continue;
  for (const r of readCsv(path)) if (r.arquivo && r[column] && available.has(r.arquivo)) lines[r[column]] = r.arquivo;
}

writeFileSync(OUT, JSON.stringify({ files, lines }, null, 1) + '\n');
const count = (prefix) => files.filter((f) => f.startsWith(prefix)).length;
console.log(
  `Índice gerado: ${files.length} arquivos (efeitos ${count('sfx/')}, mobs ${count('mobs/')}, ` +
    `músicas ${count('musica/')}, falas ${count('voz/')}); ${Object.keys(lines).length} falas ligadas a textos.`
);
