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
import { buildRounds, parseCounting, tasksPerRound, MIN_TASKS } from '../src/lib/activityParsers';
import type { Adaptive } from '../src/lib/adaptive';
import type { Activity } from '../src/types';
import { inspect } from './auditActivities';

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
if (!problems.size) console.log('OK: nenhum problema.');
for (const [where, msgs] of problems) {
  console.log(`✗ ${where}`);
  msgs.forEach((m) => console.log(`    ${m}`));
}
process.exitCode = problems.size ? 1 : 0;
