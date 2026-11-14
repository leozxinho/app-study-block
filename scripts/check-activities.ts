/**
 * Checagem rápida das fases da aventura (as 6 faixas × 100 fases), nos 3 níveis adaptativos.
 *
 *   npm run check:activities
 *
 * Para cada fase monta as rodadas como o jogo monta (buildRounds) e confere com os mesmos
 * parsers da tela (inspect de scripts/auditActivities.ts):
 * - resposta certa entre as opções, opções sem repetição, contas corretas;
 * - pelo menos 5 tarefas por fase;
 * - rodadas idênticas (mesma pergunta e mesmo conteúdo sempre, sem nada sorteado).
 * Sai com código 1 se achar problema.
 */
import { ADVENTURE_ACTIVITIES } from '../src/data/adventureActivities';
import { generateAdventureLevels } from '../src/data/adventureWorlds';
import { buildRounds, parseCounting, parseMathMobs, parseWordBuilder, tasksPerRound, MIN_TASKS } from '../src/lib/activityParsers';
import type { Adaptive } from '../src/lib/adaptive';
import type { Activity } from '../src/types';
import { inspect } from './auditActivities';
import { readFileSync, existsSync } from 'node:fs';
import { mathPieces, speechText } from '../src/lib/voice';

const AGES = ['bercario', 'maternal', 'pre-escola-1', 'pre-escola-2', 'fundamental-1', 'fundamental-2'];
const LEVELS: Adaptive[] = ['easier', 'normal', 'harder'];
/** Montagens por fase e nível (o conteúdo é sorteado). */
const SAMPLES = 3;

const byId = new Map<string, Activity>(Object.values(ADVENTURE_ACTIVITIES).flat().map((a) => [a.id, a]));
const problems = new Map<string, Set<string>>();
const add = (where: string, msg: string) => (problems.get(where) ?? problems.set(where, new Set()).get(where)!).add(msg);

/** Estes tipos sorteiam o conteúdo dentro do componente (mobs, grade): mesma pergunta não é rodada igual. */
const RANDOM_IN_COMPONENT = new Set(['shadow-match', 'build-pattern']);
/** Contagem com faixa na pergunta "(1 ou 2)": opções até o maior da faixa + esta folga. */
const ABOVE_RANGE: Record<string, number> = { bercario: 2, maternal: 3 };

/** Conteúdo montado (com o que foi sorteado). Igual em várias montagens = nada é sorteado. */
const fingerprint = (a: Activity) => JSON.stringify(inspect(a).meta);
const fixedCache = new Map<string, boolean>();
function isFixed(a: Activity): boolean {
  const key = `${a.activity_type}|${a.difficulty}|${a.age_group}|${a.question}`;
  if (!fixedCache.has(key)) {
    const first = fingerprint(a);
    fixedCache.set(key, Array.from({ length: 5 }, () => fingerprint(a)).every((f) => f === first));
  }
  return fixedCache.get(key)!;
}

// Voz gravada: mesmo critério de src/lib/voice.ts (frase inteira no manifest, ou montada com as peças)
const manifest = existsSync('public/audio/manifest.json')
  ? (JSON.parse(readFileSync('public/audio/manifest.json', 'utf8')) as { files: string[]; lines: Record<string, string> })
  : { files: [], lines: {} };
const audioFiles = new Set(manifest.files);
const withoutHints = (t: string) => t.replace(/\s*\([^)]*\d[^)]*\)/g, '').trim();
const wholeLine = (t: string) => [speechText(t), speechText(withoutHints(t))].some((k) => audioFiles.has(manifest.lines[k]));
const voice = { whole: 0, pieces: 0, device: 0 };
const deviceByFormat = new Map<string, number>();
/** O que o cartão da atividade fala (igual aos componentes: alguns trocam ou limpam o texto). */
function spokenText(r: Activity): string {
  if (r.activity_type === 'math-mobs') {
    // MathMobsActivity: lê a conta montada com as peças; sem elas, "Quanto dá a conta?"
    const { a, b, op } = parseMathMobs(r).problem;
    const conta = `Quanto é ${a} ${op} ${b}?`;
    return mathPieces(conta)?.every((f) => audioFiles.has(f)) ? conta : 'Quanto dá a conta?';
  }
  if (r.activity_type === 'word-builder') return parseWordBuilder(r).displayQuestion;
  if (r.activity_type === 'counting') return parseCounting(r).displayQuestion;
  return r.question;
}
function countVoice(r: Activity) {
  const text = spokenText(r);
  if (wholeLine(text)) return void voice.whole++;
  const pieces = mathPieces(text);
  if (pieces && pieces.every((f) => audioFiles.has(f))) return void voice.pieces++;
  voice.device++;
  const format = `${r.activity_type}: ${text.replace(/\d+/g, 'N')}`;
  deviceByFormat.set(format, (deviceByFormat.get(format) ?? 0) + 1);
}

let rounds = 0;
let phases = 0;
for (const age of AGES) {
  for (const level of generateAdventureLevels(age)) {
    phases++;
    const where = `${age} fase ${level.levelNumber}`;
    const acts = level.activityIds.map((id) => byId.get(id));
    if (acts.some((a) => !a)) {
      add(where, 'aponta para atividade que não existe');
      continue;
    }
    for (const adaptive of LEVELS) {
      for (let s = 0; s < SAMPLES; s++) {
        let tasks = 0;
        for (const a of acts as Activity[]) {
          const list = buildRounds(a, adaptive);
          list.forEach((r, i) => {
            rounds++;
            countVoice(r);
            tasks += tasksPerRound(r);
            inspect(r).problems.forEach((p) => add(where, `${adaptive}: "${r.question}": ${p}`));
            const twin = list.findIndex((o, j) => j < i && o.question === r.question);
            if (r.activity_type === 'counting' && ABOVE_RANGE[age] !== undefined && /\(\s*\d/.test(r.question)) {
              const p = parseCounting(r);
              const max = p.range[1] + ABOVE_RANGE[age];
              if (p.options.some((n) => n > max)) add(where, `${adaptive}: "${r.question}": opção acima de ${max} (${p.options.join(', ')})`);
            }
            if (twin >= 0 && !RANDOM_IN_COMPONENT.has(r.activity_type) && isFixed(r)) add(where, `${adaptive}: rodadas ${twin + 1} e ${i + 1} idênticas ("${r.question}")`);
          });
        }
        if (tasks < MIN_TASKS) add(where, `${adaptive}: só ${tasks} tarefas (mínimo ${MIN_TASKS})`);
      }
    }
  }
}

console.log(`Fases: ${phases} | rodadas conferidas: ${rounds} (${LEVELS.length} níveis × ${SAMPLES} montagens)`);
const pct = (n: number) => `${((100 * n) / rounds).toFixed(1)}%`;
console.log(`Voz da pergunta: gravada inteira ${voice.whole} (${pct(voice.whole)}) | montada com peças ${voice.pieces} (${pct(voice.pieces)}) | voz do aparelho ${voice.device} (${pct(voice.device)})`);
if (process.argv.includes('--voz')) {
  [...deviceByFormat].sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`    ${n} × ${f}`));
}
if (!problems.size) console.log('OK: nenhum problema.');
for (const [where, msgs] of problems) {
  console.log(`✗ ${where}`);
  msgs.forEach((m) => console.log(`    ${m}`));
}
process.exitCode = problems.size ? 1 : 0;
