/**
 * Auditoria das atividades do StudyBlock.
 *
 *   npx tsx scripts/auditActivities.ts                 → imprime os problemas
 *   npx tsx scripts/auditActivities.ts --md out.md     → também gera o relatório em Markdown
 *   npx tsx scripts/auditActivities.ts --all           → no relatório, lista também as atividades OK
 *
 * Usa os MESMOS parsers dos componentes (src/lib/activityParsers): o que a auditoria vê
 * é o que a criança vê. Cada atividade é montada várias vezes (o conteúdo é sorteado)
 * e todas as rodadas extras também são conferidas.
 *
 * Sai com código 1 se houver problema de gravidade ALTA (útil em CI).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { EXTRA_CONTENT } from '../src/data/extraContent';
import { NEW_TYPE_ACTIVITIES } from '../src/data/newTypeActivities';
import { ADVENTURE_ACTIVITIES } from '../src/data/adventureActivities';
import { generateAdventureLevels } from '../src/data/adventureWorlds';
import type { Activity, ActivityType } from '../src/types';
import {
  MIN_TASKS, MEMORY_PAIRS, buildRounds, roundCount, tasksPerRound,
  parseMultipleChoice, parseCounting, parseColor, parseShape, parseLetter, parseSequence, parseOrdering,
  parseClick, parseMatching, parseMemory, parseDragDrop, parseCrafting, parseMiningMath, parseWordBuilder,
  buildSize, parseMathMobs, parseClock, parseReading, MATH_MOBS_ROUNDS, type ParseMeta,
} from '../src/lib/activityParsers';
import { DIFFICULTY_RULES, problemIssue } from '../src/lib/mathGenerator';

// ---------------------------------------------------------------------------

/** Tipos com componente registrado em ActivityRenderer. */
const RENDERED_TYPES: ActivityType[] = [
  'multiple-choice', 'counting', 'color-identification', 'memory', 'matching', 'ordering',
  'shape-identification', 'letter-identification', 'sequence', 'click-correct', 'drag-drop',
  'crafting', 'mining-math', 'word-builder', 'shadow-match', 'build-pattern', 'math-mobs', 'clock', 'reading',
];
const AGE_GROUPS = ['bercario', 'maternal', 'pre-escola-1', 'pre-escola-2', 'fundamental-1', 'fundamental-2'] as const;
const CATEGORIES = ['matematica', 'linguagem', 'cores', 'formas', 'coordenacao', 'natureza', 'desafios'];
const DIFFICULTIES = ['facil', 'medio', 'dificil'];
/** Quantas vezes cada atividade é montada (o conteúdo é sorteado). */
const SAMPLES = 4;

type Severity = 'alta' | 'média' | 'baixa';
interface Issue { sev: Severity; msg: string }
interface Row { source: string; activity: Activity; tasks: number; rounds: number; generated: string; issues: Issue[] }
const SEV_ORDER: Record<Severity, number> = { alta: 0, média: 1, baixa: 2 };

const dupes = <T,>(list: T[]) => list.filter((v, i) => list.indexOf(v) !== i);

// ---------------------------------------------------------------------------
// Inspeção de UMA pergunta (original ou rodada extra) usando os parsers
// ---------------------------------------------------------------------------

export interface Inspection { meta: ParseMeta; summary: string; problems: string[] }

export function inspect(a: Activity): Inspection {
  const problems: string[] = [];
  const check = (cond: boolean, msg: string) => { if (!cond) problems.push(msg); };

  switch (a.activity_type) {
    case 'multiple-choice': {
      const p = parseMultipleChoice(a);
      const texts = p.options.map((o) => o.text);
      check(p.options.filter((o) => o.isCorrect).length === 1, 'não há exatamente 1 alternativa certa');
      check(texts.includes(p.correct), 'resposta certa não está entre as alternativas');
      check(!dupes(texts).length, `alternativas repetidas (${dupes(texts).join(', ')})`);
      check(texts.every((t) => !/^-\d/.test(t)), 'alternativa negativa');
      if (p.math) check(Number.isInteger(p.math.answer) && p.math.answer >= 0, `conta inválida (${p.math.a} ${p.math.op} ${p.math.b} = ${p.math.answer})`);
      return { meta: p, summary: p.math ? `${p.math.a} ${p.math.op} ${p.math.b} = ${p.math.answer}` : `${p.kind}: ${p.correct}`, problems };
    }
    case 'counting': {
      const p = parseCounting(a);
      check(p.options.includes(p.count), 'quantidade certa não está nas alternativas');
      check(!dupes(p.options).length, 'alternativas repetidas');
      check(p.options.every((n) => n > 0), 'alternativa ≤ 0');
      check(p.range[0] >= 1 && p.range[0] <= p.range[1], `faixa inválida ${p.range.join('-')}`);
      const figure = p.icon.emoji ?? p.icon.mob ?? 'variadas';
      return { meta: p, summary: `${p.range[0]}-${p.range[1]} × ${figure}`, problems };
    }
    case 'color-identification': {
      const p = parseColor(a);
      const names = p.options.map((o) => o.name);
      check(names.includes(p.target.name), 'cor certa não está nas opções');
      check(!dupes(names).length, 'cores repetidas');
      return { meta: p, summary: `cor: ${p.target.name}`, problems };
    }
    case 'shape-identification': {
      const p = parseShape(a);
      const ids = p.options.map((o) => o.id);
      check(ids.includes(p.target.id), 'forma certa não está nas opções');
      check(!dupes(ids).length, 'formas repetidas');
      return { meta: p, summary: `forma: ${p.target.id}`, problems };
    }
    case 'letter-identification': {
      const p = parseLetter(a);
      const letters = p.options.map((o) => o.letter);
      check(letters.includes(p.correct), 'letra certa não está nas opções');
      check(!dupes(letters).length, 'letras repetidas');
      return { meta: p, summary: `letra: ${p.correct}`, problems };
    }
    case 'sequence': {
      const p = parseSequence(a);
      const vals = p.options.map((o) => o.value);
      check(vals.includes(p.answer.value), 'resposta não está nas opções');
      check(!dupes(vals).length, 'opções repetidas');
      if (p.answer.isNumber) check(vals.every((v) => +v >= 0), 'opção negativa');
      return { meta: p, summary: `${p.pattern.map((x) => x.value).join(' ')} → ${p.answer.value}`, problems };
    }
    case 'ordering': {
      const p = parseOrdering(a);
      check(p.items.length >= 2, 'menos de 2 peças');
      if (p.kind === 'numbers') check(!dupes(p.items.map((i) => i.text)).length, 'números repetidos');
      return { meta: p, summary: `${p.kind}: ${p.items.map((i) => i.text).join(' ')}`, problems };
    }
    case 'click-correct': {
      const p = parseClick(a);
      const ids = p.items.map((i) => i.id);
      check(!dupes(ids).length, 'itens repetidos');
      if (!p.anyCorrect) check(p.items.filter((i) => i.isCorrect).length === 1, 'não há exatamente 1 item certo');
      return { meta: p, summary: p.anyCorrect ? 'qualquer um' : `alvo: ${p.target?.label}`, problems };
    }
    case 'matching': {
      const p = parseMatching(a);
      check(p.items.some((i) => i.id === p.target.id), 'modelo não está nas opções');
      check(!dupes(p.items.map((i) => i.icon)).length, 'figuras repetidas');
      return { meta: p, summary: `modelo: ${p.target.name}`, problems };
    }
    case 'memory': {
      const p = parseMemory(a);
      check(p.icons.length === MEMORY_PAIRS && !dupes(p.icons.map((i) => i.icon)).length, 'pares insuficientes ou repetidos');
      return { meta: p, summary: p.icons.map((i) => i.icon).join(''), problems };
    }
    case 'drag-drop': {
      const p = parseDragDrop(a);
      const idx = p.items.map((i) => i.correctIndex).filter((i) => i >= 0).sort((x, y) => x - y);
      check(idx.length === p.slots && idx.every((v, i) => v === i), 'peças não preenchem os espaços');
      return { meta: p, summary: `${p.mode}: ${p.items.filter((i) => i.correctIndex >= 0).map((i) => i.emoji ?? i.label).join(' ')}${p.targetEmoji ? ` → ${p.targetEmoji}` : ''}`, problems };
    }
    case 'crafting': {
      const p = parseCrafting(a);
      check(p.cells.some(Boolean), 'receita vazia');
      return { meta: p, summary: `receita: ${p.tool} (${p.material})`, problems };
    }
    case 'mining-math': {
      const p = parseMiningMath(a);
      check(Number.isInteger(p.problem.answer) && p.problem.answer >= 0, `conta inválida (${p.problem.a} ${p.problem.op} ${p.problem.b})`);
      return { meta: p, summary: `${p.problem.a} ${p.problem.op} ${p.problem.b} = ${p.problem.answer}`, problems };
    }
    case 'word-builder': {
      const p = parseWordBuilder(a);
      check(p.pieces.join('') === p.word, 'peças não formam a palavra');
      return { meta: p, summary: `${p.bySyllable ? 'sílabas' : 'letras'}: ${p.pieces.join(p.bySyllable ? '-' : '')}`, problems };
    }
    case 'build-pattern': {
      const p = buildSize(a);
      return { meta: p, summary: `grade ${p.size}x${p.size}`, problems };
    }
    case 'shadow-match':
      return { meta: { recognized: true }, summary: 'mobs sorteados', problems };
    case 'math-mobs': {
      const p = parseMathMobs(a);
      const { a: x, b: y, op, answer } = p.problem;
      const issue = problemIssue(p.problem);
      if (issue) problems.push(issue);
      check(DIFFICULTY_RULES[a.difficulty].ops.includes(op), `operação ${op} não é permitida na dificuldade ${a.difficulty}`);
      if (a.difficulty === 'facil') check(x <= 5 && y <= 5, `fácil deve usar números até 5 (${x} ${op} ${y})`);
      if (a.difficulty === 'medio' && op === '×') check(x <= 3 && y <= 3, `médio: × até 3x3 (${x} × ${y})`);
      check(p.options.length >= 3 && p.options.length <= 4, `${p.options.length} alternativas (esperado 3 ou 4)`);
      check(p.options.includes(answer), 'resposta não está entre as alternativas');
      check(!dupes(p.options).length, 'alternativas repetidas');
      check(p.options.every((n) => n >= 0), 'alternativa negativa');
      return { meta: p, summary: `${x} ${op} ${y} = ${answer} (${p.unit.plural})`, problems };
    }
    case 'clock': {
      const p = parseClock(a);
      check(p.options.length === 4, `${p.options.length} alternativas (esperado 4)`);
      check(!dupes(p.options).length, 'alternativas repetidas');
      return { meta: p, summary: `${p.hour}:${String(p.minute).padStart(2, '0')}`, problems };
    }
    case 'reading': {
      const p = parseReading(a);
      check(p.options.some((o) => o.word === p.word), 'figura certa não está entre as opções');
      check(!dupes(p.options.map((o) => o.emoji)).length, 'figuras repetidas');
      return { meta: p, summary: p.word, problems };
    }
    default:
      return { meta: { recognized: false, note: `tipo "${a.activity_type}" sem parser` }, summary: '—', problems };
  }
}

// ---------------------------------------------------------------------------

function auditActivity(a: Activity, source: string): Row {
  const issues: Issue[] = [];
  const add = (sev: Severity, msg: string) => { if (!issues.some((i) => i.msg === msg)) issues.push({ sev, msg }); };

  if (!a.id) add('alta', 'sem id');
  if (!a.title?.trim()) add('média', 'sem título');
  if (!a.question?.trim()) add('alta', 'sem pergunta (atividade vazia)');
  if (!AGE_GROUPS.includes(a.age_group)) add('alta', `faixa etária inválida "${a.age_group}"`);
  if (!CATEGORIES.includes(a.category)) add('média', `categoria inválida "${a.category}"`);
  if (!DIFFICULTIES.includes(a.difficulty)) add('média', `dificuldade inválida "${a.difficulty}"`);
  if (!(a.points > 0)) add('baixa', 'pontos ≤ 0');

  if (!RENDERED_TYPES.includes(a.activity_type)) {
    add('alta', `tipo "${a.activity_type}" não tem componente (cai em MultipleChoice)`);
    return { source, activity: a, tasks: 0, rounds: 0, generated: '—', issues };
  }
  if (!a.question?.trim()) return { source, activity: a, tasks: 0, rounds: 0, generated: '—', issues };

  let generated = '';
  let tasks = 0;
  const rounds = roundCount(a);
  for (let s = 0; s < SAMPLES; s++) {
    const list = buildRounds(a);
    tasks = Math.max(tasks, list.reduce((sum, r) => sum + tasksPerRound(r), 0));
    list.forEach((r, i) => {
      const where = i === 0 ? 'pergunta' : `rodada extra "${r.question}"`;
      const res = inspect(r);
      if (i === 0 && s === 0) generated = res.summary;
      if (!res.meta.recognized) add(i === 0 ? 'alta' : 'média', `${where}: ${res.meta.note ?? 'não reconhecida'}`);
      res.problems.forEach((p) => add('alta', `${where}: ${p}`));
    });
  }
  if (tasks < MIN_TASKS) add('alta', `só ${tasks} tarefa(s) (mínimo ${MIN_TASKS})`);
  if (a.activity_type === 'math-mobs' && tasks !== MATH_MOBS_ROUNDS) add('alta', `math-mobs deve ter ${MATH_MOBS_ROUNDS} tarefas (tem ${tasks})`);
  return { source, activity: a, tasks, rounds, generated, issues };
}

function auditAll(list: { a: Activity; source: string }[]): Row[] {
  const rows = list.map(({ a, source }) => auditActivity(a, source));
  const byId = new Map<string, Row[]>();
  rows.forEach((r) => byId.set(r.activity.id, [...(byId.get(r.activity.id) ?? []), r]));
  for (const [id, rs] of byId) if (rs.length > 1) rs.forEach((r) => r.issues.push({ sev: 'alta', msg: `id "${id}" repetido ${rs.length}×` }));

  const byQ = new Map<string, Row[]>();
  rows.forEach((r) => {
    const k = `${r.activity.age_group}|${r.activity.question.trim().toLowerCase()}`;
    byQ.set(k, [...(byQ.get(k) ?? []), r]);
  });
  for (const rs of byQ.values()) {
    if (rs.length > 1) rs.forEach((r) => r.issues.push({ sev: 'baixa', msg: `pergunta igual a ${rs.filter((o) => o !== r).map((o) => o.activity.id).join(', ')} (mesma faixa)` }));
  }
  return rows;
}

function auditAdventure(allIds: Map<string, Activity>): Issue[] {
  const issues: Issue[] = [];
  const referenced = new Set<string>();
  for (const age of AGE_GROUPS) {
    const levels = generateAdventureLevels(age);
    if (levels.length !== 100) issues.push({ sev: 'alta', msg: `${age}: ${levels.length} fases (esperado 100)` });
    for (const level of levels) {
      if (!level.activityIds.length) issues.push({ sev: 'alta', msg: `${age} fase ${level.levelNumber}: sem atividade` });
      level.activityIds.forEach((id, i) => {
        referenced.add(id);
        const act = allIds.get(id);
        if (!act) return void issues.push({ sev: 'alta', msg: `${age} fase ${level.levelNumber}: aponta para "${id}", que não existe` });
        if (act.age_group !== age) issues.push({ sev: 'média', msg: `${age} fase ${level.levelNumber}: "${id}" é da faixa ${act.age_group}` });
        if (i === 0 && Number(id.split('-').pop()) !== level.levelNumber) issues.push({ sev: 'média', msg: `${age} fase ${level.levelNumber}: usa "${id}" (número não bate)` });
      });
    }
  }
  const orphan = [...allIds.keys()].filter((id) => id.startsWith('adv-') && !referenced.has(id));
  if (orphan.length) issues.push({ sev: 'baixa', msg: `${orphan.length} atividade(s) da aventura sem fase: ${orphan.join(', ')}` });
  return issues;
}

// ---------------------------------------------------------------------------
// Supabase (opcional, só leitura)
// ---------------------------------------------------------------------------

function readEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const file = resolve(process.cwd(), '.env');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

async function loadSupabase(): Promise<{ list: Activity[]; note: string }> {
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder') || url.includes('your-supabase')) {
    return { list: [], note: 'Supabase não configurado (.env sem VITE_SUPABASE_URL/ANON_KEY): pulado.' };
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const { data, error } = await createClient(url, key).from('activities').select('*');
    if (error) return { list: [], note: `Supabase: erro ao ler "activities": ${error.message}` };
    return { list: (data ?? []) as Activity[], note: `Supabase: ${data?.length ?? 0} atividades lidas.` };
  } catch (e) {
    return { list: [], note: `Supabase: falhou (${(e as Error).message})` };
  }
}

// ---------------------------------------------------------------------------

const worst = (r: Row): Severity | null =>
  r.issues.length ? r.issues.reduce<Severity>((w, i) => (SEV_ORDER[i.sev] < SEV_ORDER[w] ? i.sev : w), 'baixa') : null;

function toMarkdown(rows: Row[], adventure: Issue[], notes: string[], showAll: boolean): string {
  const esc = (s: string) => s.replace(/\|/g, '\\|');
  const sorted = [...rows].sort((a, b) => {
    const wa = worst(a), wb = worst(b);
    return (wa ? SEV_ORDER[wa] : 9) - (wb ? SEV_ORDER[wb] : 9) || a.activity.id.localeCompare(b.activity.id);
  });
  const lines = [
    '# Auditoria de atividades — StudyBlock', '',
    `Gerado em ${new Date().toLocaleString('pt-BR')} por \`npx tsx scripts/auditActivities.ts\`.`, '',
    ...notes.map((n) => `- ${n}`),
    `- Tarefa = uma resposta da criança (escolher, colocar uma peça, achar um par). Mínimo: ${MIN_TASKS} por atividade (a 1ª rodada é a pergunta original; as outras são variações).`,
    '', '## Aventura (fases → atividades)', '',
    ...(adventure.length ? adventure.map((g) => `- **${g.sev}** — ${esc(g.msg)}`) : ['- Nenhum problema: todas as fases apontam para atividades existentes.']),
    '', '## Atividades', '',
    '| ID | Título | Tipo | Nº de tarefas | O que o componente gera | Problemas encontrados | Gravidade |',
    '|---|---|---|---|---|---|---|',
  ];
  for (const r of sorted) {
    const w = worst(r);
    if (!w && !showAll) continue;
    const probs = r.issues.length ? r.issues.map((i) => `(${i.sev}) ${i.msg}`).join('<br>') : 'OK';
    lines.push(`| ${r.activity.id} | ${esc(r.activity.title)} | ${r.activity.activity_type} | ${r.tasks} (${r.rounds} rodada${r.rounds > 1 ? 's' : ''}) | ${esc(r.generated)} | ${esc(probs)} | ${w ?? '—'} |`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const args = process.argv.slice(2);
  const mdPath = args.includes('--md') ? args[args.indexOf('--md') + 1] : null;
  const showAll = args.includes('--all');

  const list: { a: Activity; source: string }[] = [
    ...NEW_TYPE_ACTIVITIES.map((a) => ({ a, source: 'newTypeActivities' })),
    ...EXTRA_CONTENT.map((a) => ({ a, source: 'extraContent (fora do jogo)' })),
    ...Object.values(ADVENTURE_ACTIVITIES).flat().map((a) => ({ a, source: 'adventureActivities' })),
  ];
  const supa = await loadSupabase();
  list.push(...supa.list.map((a) => ({ a, source: 'supabase' })));

  const rows = auditAll(list);
  const adventure = auditAdventure(new Map(list.map(({ a }) => [a.id, a])));

  const count = (s: Severity) => rows.filter((r) => worst(r) === s).length;
  const ok = rows.filter((r) => !r.issues.length).length;
  const empty = rows.filter((r) => !r.activity.question?.trim()).length;
  const C = { red: '\x1b[31m', yellow: '\x1b[33m', gray: '\x1b[90m', bold: '\x1b[1m', reset: '\x1b[0m' };
  const color: Record<Severity, string> = { alta: C.red, média: C.yellow, baixa: C.gray };

  console.log(`${C.bold}Auditoria de atividades — StudyBlock${C.reset}`);
  console.log(supa.note);
  console.log(`\n${C.bold}Aventura${C.reset}`);
  if (!adventure.length) console.log('  OK: todas as fases apontam para atividades existentes.');
  for (const g of adventure) console.log(`  ${color[g.sev]}[${g.sev}]${C.reset} ${g.msg}`);

  const bad = rows.filter((x) => x.issues.length).sort((a, b) => SEV_ORDER[worst(a)!] - SEV_ORDER[worst(b)!]);
  console.log(`\n${C.bold}Atividades com problema${C.reset}${bad.length ? '' : ': nenhuma'}`);
  for (const r of bad) {
    console.log(`  ${r.activity.id} (${r.activity.activity_type}) "${r.activity.question}"`);
    for (const i of r.issues) console.log(`     ${color[i.sev]}[${i.sev}]${C.reset} ${i.msg}`);
  }

  const minTasks = Math.min(...rows.map((r) => r.tasks));
  console.log(`\n${C.bold}Resumo${C.reset}`);
  console.log(`  Total: ${rows.length} | OK: ${ok} | vazias: ${empty} | com problema: ${rows.length - ok} (alta ${count('alta')}, média ${count('média')}, baixa ${count('baixa')})`);
  console.log(`  Tarefas por atividade: mínimo ${minTasks} (exigido ${MIN_TASKS})`);

  if (mdPath) {
    writeFileSync(mdPath, toMarkdown(rows, adventure, [supa.note], showAll));
    console.log(`\nRelatório Markdown: ${mdPath}`);
  }
  process.exitCode = count('alta') > 0 || adventure.some((i) => i.sev === 'alta') ? 1 : 0;
}

// Só roda quando chamado direto (scripts/check-activities.ts importa o inspect daqui)
if (/auditActivities\.ts$/.test(process.argv[1] ?? '')) main();
