/**
 * Exporta as perguntas fixas das atividades para a gravação das falas.
 *   npx tsx scripts/exportVoiceLines.ts
 * Gera docs/audio/falas-perguntas.csv: arquivo, faixa etária, texto que será falado e onde é usado.
 * Perguntas iguais em atividades diferentes viram um arquivo só.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { ADVENTURE_ACTIVITIES } from '../src/data/adventureActivities';
import { EXTRA_CONTENT } from '../src/data/extraContent';
import { NEW_TYPE_ACTIVITIES } from '../src/data/newTypeActivities';
import { stripNumberHints } from '../src/lib/text';
import { speechText } from '../src/lib/voice';
import { hideAnswer, parseWordBuilder, variantPool } from '../src/lib/activityParsers';
import type { Activity } from '../src/types';

const all = [...Object.values(ADVENTURE_ACTIVITIES).flat(), ...EXTRA_CONTENT, ...NEW_TYPE_ACTIVITIES];
const lines = new Map<string, { ages: Set<string>; ids: string[] }>();
for (const a of all) {
  const spoken = speechText(stripNumberHints(a.question));
  if (!spoken) continue;
  const entry = lines.get(spoken) ?? { ages: new Set<string>(), ids: [] };
  entry.ages.add(a.age_group);
  entry.ids.push(a.id);
  lines.set(spoken, entry);
}

const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;
const rows = ['arquivo;faixas;texto_falado;usada_em'];
let n = 0;
for (const [text, { ages, ids }] of lines) {
  n++;
  rows.push([`voz/perguntas/q-${String(n).padStart(4, '0')}.mp3`, csv([...ages].join(', ')), csv(text), csv(ids.join(' '))].join(';'));
}
// O CSV das perguntas já foi gravado (q-0001...): não reescreve para não trocar os nomes.
// Sem --perguntas, só acrescenta no fim os textos novos, com os próximos números (q-0674, q-0675...).
const QUESTIONS_CSV = 'docs/audio/falas-perguntas.csv';
if (process.argv.includes('--perguntas')) {
  writeFileSync(QUESTIONS_CSV, rows.join('\n') + '\n');
  console.log(`${n} perguntas exportadas para ${QUESTIONS_CSV}`);
} else {
  const current = readFileSync(QUESTIONS_CSV, 'utf8');
  const known = new Set([...current.matchAll(/^[^;]+;"[^"]*";"((?:[^"]|"")*)"/gm)].map((m) => m[1].replace(/""/g, '"')));
  let last = Math.max(0, ...[...current.matchAll(/q-(\d{4})\.mp3/g)].map((m) => Number(m[1])));
  const added: string[] = [];
  for (const [text, { ages, ids }] of lines) {
    // Relógio e leitura: a resposta fica entre [colchetes] e não é falada (essas atividades têm vozes próprias)
    if (known.has(text) || text.includes('[')) continue;
    last++;
    added.push([`voz/perguntas/q-${String(last).padStart(4, '0')}.mp3`, csv([...ages].join(', ')), csv(text), csv(ids.join(' '))].join(';'));
  }
  if (added.length) writeFileSync(QUESTIONS_CSV, current.replace(/\n*$/, '\n') + added.join('\n') + '\n');
  console.log(`${n} perguntas conferidas; ${added.length} novas acrescentadas no fim de ${QUESTIONS_CSV}`);
}

// =====================================================================
// Rodadas: variações fixas de cada atividade (src/lib/activityParsers/rounds.ts, variantPool)
// e textos da 1ª rodada que a tela mostra diferente do CSV (ex.: "montar palavra" sem a resposta).
// Gera docs/audio/falas-rodadas.csv no formato do falas-voz-suave.csv (script da ElevenLabs).
// O nome do arquivo vem do texto (r-<código>.mp3): não muda se a lista for gerada de novo.
// =====================================================================
const recorded = new Set(lines.keys());
const SPEED: Record<string, string> = {
  bercario: '-22%', maternal: '-18%', 'pre-escola-1': '-12%', 'pre-escola-2': '-10%', 'fundamental-1': '-6%', 'fundamental-2': '-4%',
};
const AGE_ORDER = Object.keys(SPEED);

/** O texto que a pergunta mostra na tela (é ele que a voz lê). */
function shownQuestion(a: Activity): string | null {
  if (a.activity_type === 'math-mobs') return null; // a tela mostra "Quanto dá a conta?" (já gravada)
  if (a.activity_type === 'counting') return stripNumberHints(a.question);
  if (a.activity_type === 'word-builder') return parseWordBuilder(a).displayQuestion;
  if (a.activity_type === 'clock' || a.activity_type === 'reading') return hideAnswer(a.question); // a resposta não é lida
  return a.question;
}

/** Como a voz deve falar (o jogo procura pela coluna texto_original). */
function forVoice(text: string): string {
  return text
    // sílabas: "BO mais LO" / "MI-NA" → "BO, LO" / "MI, NA"
    .replace(/\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{1,4}) mais (?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{1,4}\b)/g, '$1, ')
    .replace(/(sílabas: )([A-ZÁÉÍÓÚÂÊÔÃÕÇ-]+)/, (_, a: string, b: string) => a + b.split('-').join(', '))
    // sequência: "4, 6, 8, ?" → "4, 6, 8... e depois?"
    .replace(/,\s*\?$/, '... e depois?')
    .replace(/,\s*\.\.\.\?$/, '... e depois?');
}

function fileFor(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `voz/rodadas/r-${(h >>> 0).toString(16).padStart(8, '0')}.mp3`;
}

const rounds = new Map<string, { ages: Set<string>; ids: Set<string> }>();
for (const a of all) {
  const texts = [shownQuestion(a), ...variantPool(a).map((q) => shownQuestion({ ...a, question: q }))];
  for (const t of texts) {
    if (!t) continue;
    const key = speechText(t);
    if (!key || recorded.has(key) || recorded.has(speechText(stripNumberHints(t)))) continue;
    const entry = rounds.get(key) ?? { ages: new Set<string>(), ids: new Set<string>() };
    entry.ages.add(a.age_group);
    entry.ids.add(a.id);
    rounds.set(key, entry);
  }
}

const roundRows = ['"arquivo";"secao";"voz";"faixas";"texto_original";"texto_para_voz";"mudancas";"velocidade";"voz_azure";"ssml_azure";"usada_em"'];
const seen = new Set<string>();
let chars = 0;
for (const [key, { ages, ids }] of rounds) {
  const file = fileFor(key);
  if (seen.has(file)) throw new Error(`nome repetido para textos diferentes: ${file}`);
  seen.add(file);
  const youngest = AGE_ORDER.find((g) => ages.has(g)) ?? 'fundamental-2';
  const voice = forVoice(key);
  chars += voice.length;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="pt-BR"><voice name="pt-BR-FranciscaNeural"><mstts:express-as style="calm"><prosody rate="${SPEED[youngest]}" pitch="-2%">${voice}</prosody></mstts:express-as></voice></speak>`;
  roundRows.push(
    [file, '7.8 rodadas', 'A-narradora', [...ages].join(', '), key, voice, voice === key ? '' : 'leitura', SPEED[youngest], 'pt-BR-FranciscaNeural', ssml, [...ids].join(' ')]
      .map(csv)
      .join(';')
  );
}
writeFileSync('docs/audio/falas-rodadas.csv', roundRows.join('\n') + '\n');
console.log(`${rounds.size} falas de rodadas exportadas para docs/audio/falas-rodadas.csv (~${chars.toLocaleString('pt-BR')} caracteres)`);
