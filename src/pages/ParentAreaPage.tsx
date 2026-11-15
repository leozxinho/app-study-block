import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Plus, RefreshCw } from 'lucide-react';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { MinecraftCard } from '../components/ui/MinecraftCard';
import { Modal } from '../components/ui/Modal';
import { SubscriptionCard } from '../components/ui/SubscriptionCard';
import { TwoFactorCard } from '../components/ui/TwoFactorCard';
import { authService } from '../services/authService';
import { familyService, type ChildAccount } from '../services/familyService';
import { AGE_GROUPS } from '../lib/constants';
import { canConfirmReset, MAX_CHILDREN, RESET_WORD, strengths, validateChildInput, weekActivity, type ChildResult } from '../lib/family';
import { DEFAULT_SKIN, Mob, type PlayerSkin } from '../components/mobs';
import { isFirebaseConfigured } from '../lib/firebase';
import type { User } from '../types';

const TYPE_LABEL: Record<string, string> = {
  'multiple-choice': 'Múltipla escolha',
  'click-correct': 'Toque no certo',
  'drag-drop': 'Arrastar',
  matching: 'Ligar pares',
  ordering: 'Ordenar',
  counting: 'Contar',
  'color-identification': 'Cores',
  'shape-identification': 'Formas',
  'letter-identification': 'Letras',
  sequence: 'Sequências',
  memory: 'Memória',
  puzzle: 'Quebra-cabeça',
  crafting: 'Crafting',
  'mining-math': 'Mineração (contas)',
  'word-builder': 'Montar palavras',
  'shadow-match': 'Sombras',
  'build-pattern': 'Copiar construção',
  'math-mobs': 'Contas com mobs',
};

const ageName = (id: string) => AGE_GROUPS.find((g) => g.id === id)?.name ?? id;

function formatDay(key: string | null): string {
  if (!key) return 'ainda não jogou';
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

/** Resultados agrupados por tipo de atividade (mais jogados primeiro). */
function byType(results: ChildResult[]) {
  const groups = new Map<string, ChildResult[]>();
  results.forEach((r) => groups.set(r.type, [...(groups.get(r.type) ?? []), r]));
  return [...groups.entries()]
    .map(([type, rs]) => ({
      type,
      count: rs.length,
      avgStars: rs.reduce((s, r) => s + (r.stars || 0), 0) / rs.length,
      firstTry: Math.round((rs.filter((r) => r.errors === 0).length / rs.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

const field =
  'w-full px-3 py-2.5 pixel-border bg-gray-50 font-body text-base text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-lapis/50';

function AddChildForm({ onCreated, onCancel }: { onCreated: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const input = { name, username, password, ageGroup };
    const problem = validateChildInput(input);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await familyService.createChild(input);
      const created = name.trim();
      setName('');
      setUsername('');
      setPassword('');
      setAgeGroup('');
      onCreated(created);
    } catch (err) {
      setError((err as Error).message || 'Não deu certo. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {error && (
        <p role="alert" className="bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded-md text-sm font-body">
          {error}
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="font-body text-sm font-bold text-gray-800 block mb-1">Nome da criança</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ana" autoComplete="off" />
        </label>
        <label className="block">
          <span className="font-body text-sm font-bold text-gray-800 block mb-1">Faixa etária</span>
          <select className={field} value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
            <option value="">Escolha…</option>
            {AGE_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.icon} {g.name} ({g.ageRange})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-body text-sm font-bold text-gray-800 block mb-1">Login da criança</span>
          <input
            className={field}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            maxLength={20}
            placeholder="ana.souza"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="block">
          <span className="font-body text-sm font-bold text-gray-800 block mb-1">Senha (mínimo 6)</span>
          <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </label>
      </div>
      <p className="font-body text-xs text-gray-600">Anote o login e a senha: a criança usa os dois na aba "Sou criança".</p>
      <div className="flex flex-wrap gap-2">
        <MinecraftButton variant="success" size="md" disabled={saving}>
          {saving ? '⏳ Criando…' : '✨ Criar conta da criança'}
        </MinecraftButton>
        <MinecraftButton type="button" variant="secondary" size="md" onClick={onCancel} disabled={saving}>
          Cancelar
        </MinecraftButton>
      </div>
    </form>
  );
}

function ChildCard({
  child,
  selected,
  onToggleSelect,
  onChanged,
}: {
  child: ChildAccount;
  selected: boolean;
  onToggleSelect: () => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const s = child.summary;
  const skin = { ...DEFAULT_SKIN, ...s.skin } as PlayerSkin;
  const weekBars = weekActivity(s.results);
  const weekMax = Math.max(1, ...weekBars.map((d) => d.count));
  const weekTotal = weekBars.reduce((sum, d) => sum + d.count, 0);
  const weekDays = weekBars.filter((d) => d.count > 0).length;
  const strong = strengths(s.results);
  const weekSentence =
    weekTotal === 0
      ? `${child.name} ainda não jogou nesta semana.`
      : `Nesta semana, ${child.name} fez ${weekTotal} ${weekTotal === 1 ? 'atividade' : 'atividades'} em ${weekDays} ${weekDays === 1 ? 'dia' : 'dias'}.`;
  const types = byType(s.results);

  const changeSetting = async (patch: { dailyGoal?: number; screenTimeMin?: number }) => {
    setBusy(true);
    setError('');
    try {
      await familyService.setChildSettings(child.id, patch);
      onChanged();
    } catch (err) {
      setError((err as Error).message || 'Não deu certo.');
    } finally {
      setBusy(false);
    }
  };

  const toggleUnlock = async () => {
    setBusy(true);
    setError('');
    try {
      await familyService.setUnlockAll(child.id, !s.unlockAll);
      onChanged();
    } catch (err) {
      setError((err as Error).message || 'Não deu certo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <MinecraftCard>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1.5 w-5 h-5 accent-red-600"
            aria-label={`Marcar ${child.name} para zerar`}
          />
          {/* Personagem da criança com a roupa da loja */}
          <div className="shrink-0 w-14 h-16 rounded-lg bg-gradient-to-b from-sky-200 to-green-200 flex items-end justify-center overflow-hidden" aria-hidden="true">
            <Mob type={skin.character} skin={skin} size={44} animation="idle" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-minecraft text-sm text-gray-900 truncate">{child.name}</p>
            <p className="font-body text-xs text-gray-600">
              login <strong>{child.username}</strong> · {ageName(child.ageGroup)}
            </p>
          </div>
          <span className="font-body text-xs font-bold bg-orange-100 text-orange-900 rounded px-2 py-1" title="Dias seguidos jogando">
            🔥 {s.streak}
          </span>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 font-body text-sm">
          {[
            ['Nível', `${s.level} · ${s.xp} XP`],
            ['Fases', String(s.completedLevels)],
            ['Estrelas', `⭐ ${s.levelStars}`],
            ['Conquistas', `🏆 ${s.achievements}`],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded px-2 py-1.5">
              <dt className="text-xs text-gray-600">{label}</dt>
              <dd className="font-bold text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="font-body text-xs text-gray-600 mt-2">Último dia jogado: {formatDay(s.lastPlayed)}</p>

        {/* Resumo da semana: frase, barras por dia e pontos fortes */}
        <div className="mt-3 rounded-lg bg-sky-50 border border-sky-200 p-3">
          <p className="font-body text-sm text-gray-900">{weekSentence}</p>
          <div className="mt-2 flex items-end gap-1.5 h-20" role="img" aria-label={`Atividades por dia: ${weekBars.map((d) => `${d.label} ${d.count}`).join(', ')}`}>
            {weekBars.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="font-body text-[10px] text-gray-700 tabular-nums">{d.count || ''}</span>
                <div
                  className={`w-full rounded-t ${d.count ? (d.isToday ? 'bg-brand-gold' : 'bg-brand-emerald') : 'bg-gray-200'}`}
                  style={{ height: `${d.count ? Math.max(12, (d.count / weekMax) * 100) : 6}%` }}
                />
                <span className={`font-body text-[10px] ${d.isToday ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{d.label}</span>
              </div>
            ))}
          </div>
          {strong && (
            <div className="mt-2 flex flex-wrap gap-2 font-body text-xs">
              <span className="rounded-full bg-green-100 text-green-900 px-2 py-1">💪 Vai bem: {TYPE_LABEL[strong.best] ?? strong.best}</span>
              <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-1">📚 Pode treinar: {TYPE_LABEL[strong.worst] ?? strong.worst}</span>
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 mt-2 font-body text-sm text-gray-800">
          <span>🎯 Meta do dia:</span>
          <select
            value={s.dailyGoal}
            disabled={busy}
            onChange={(e) => void changeSetting({ dailyGoal: Number(e.target.value) })}
            className="min-h-[36px] px-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            {[1, 2, 3, 4, 5, 7, 10].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'fase' : 'fases'}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 mt-2 font-body text-sm text-gray-800">
          <span>⏱️ Tempo de tela por dia:</span>
          <select
            value={s.screenTimeMin}
            disabled={busy}
            onChange={(e) => void changeSetting({ screenTimeMin: Number(e.target.value) })}
            className="min-h-[36px] px-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            {[0, 15, 30, 45, 60, 90, 120].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'sem limite' : `${n} minutos`}
              </option>
            ))}
          </select>
        </label>

        {error && <p role="alert" className="text-red-700 font-body text-sm mt-2">{error}</p>}

        <div className="flex flex-wrap gap-2 mt-3">
          <MinecraftButton variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
            {open ? 'Esconder detalhes' : '📊 Ver detalhes'}
          </MinecraftButton>
          <MinecraftButton variant="secondary" size="sm" onClick={toggleUnlock}>
            {busy ? '⏳' : s.unlockAll ? '🔒 Voltar a trancar mundos' : '🔓 Liberar todos os mundos'}
          </MinecraftButton>
        </div>

        {open && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="font-body text-sm font-bold text-gray-800 mb-1">Resultados por tipo de atividade</p>
              {types.length === 0 ? (
                <p className="font-body text-sm text-gray-600">Nenhuma atividade concluída ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 text-xs">
                        <th className="py-1 pr-2 font-normal">Tipo</th>
                        <th className="py-1 pr-2 font-normal text-right">Feitas</th>
                        <th className="py-1 pr-2 font-normal text-right">Estrelas (média)</th>
                        <th className="py-1 font-normal text-right">Sem erro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {types.map((t) => (
                        <tr key={t.type} className="border-t border-gray-100 text-gray-900">
                          <td className="py-1 pr-2">{TYPE_LABEL[t.type] ?? t.type}</td>
                          <td className="py-1 pr-2 text-right tabular-nums">{t.count}</td>
                          <td className="py-1 pr-2 text-right tabular-nums">{t.avgStars.toFixed(1)}</td>
                          <td className="py-1 text-right tabular-nums">{t.firstTry}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MinecraftCard>
  );
}

/** Área dos Pais: crianças do responsável, progresso, liberar mundos e zerar (irreversível). */
/** Antes de usar a Área dos Pais, o responsável confirma o e-mail (as regras do banco também exigem). */
function VerifyEmailScreen({
  email,
  onVerified,
  onBack,
  onLogout,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setNote('');
    try {
      await fn();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setNote(code === 'auth/too-many-requests' ? 'Muitos envios seguidos. Espere alguns minutos.' : 'Não deu certo. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <MinecraftCard>
        <div className="p-6 max-w-md space-y-4 font-body text-gray-900 text-center">
          <div className="text-4xl" aria-hidden="true">📧</div>
          <h1 className="font-minecraft text-base">Confirme seu e-mail</h1>
          <p className="text-sm">
            Enviamos um link para <strong className="break-all">{email}</strong>. Abra o e-mail, toque no link e volte aqui.
            Se não achar, veja a caixa de spam.
          </p>
          {note && (
            <p role="status" className="text-sm bg-amber-50 border border-amber-300 rounded-md px-3 py-2">
              {note}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <MinecraftButton
              variant="success"
              size="md"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  if (await authService.refreshVerification()) onVerified();
                  else setNote('Ainda não confirmado. Toque no link do e-mail e tente de novo.');
                })
              }
            >
              ✅ Já confirmei
            </MinecraftButton>
            <MinecraftButton
              variant="secondary"
              size="md"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await authService.resendVerification();
                  setNote('E-mail reenviado.');
                })
              }
            >
              Reenviar e-mail
            </MinecraftButton>
            <div className="flex gap-2 justify-center">
              <MinecraftButton variant="info" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 inline" aria-hidden="true" /> Voltar ao início
              </MinecraftButton>
              <MinecraftButton variant="secondary" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 inline" aria-hidden="true" /> Sair
              </MinecraftButton>
            </div>
          </div>
        </div>
      </MinecraftCard>
    </div>
  );
}

export function ParentAreaPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<ChildAccount[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const list = await familyService.listChildren();
      setChildren(list);
      setSelected((prev) => new Set([...prev].filter((id) => list.some((c) => c.id === id))));
    } catch (err) {
      setLoadError((err as Error).message || 'Não foi possível carregar as crianças.');
    }
  }, []);

  // Só o responsável entra aqui: sem login vai para o login; criança volta para o início
  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      if (!u) navigate('/login', { replace: true });
      else if (u.role === 'student') navigate('/inicio', { replace: true });
      else {
        setUser(u);
        void authService.isEmailVerified().then((ok) => {
          setVerified(ok);
          if (ok) void load();
        });
      }
    });
  }, [navigate, load]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedChildren = (children ?? []).filter((c) => selected.has(c.id));
  const canAdd = !!children && children.length < MAX_CHILDREN;
  const openAdd = () => {
    setMessage('');
    setShowAdd(true);
    window.scrollTo({ top: 0 });
  };

  const confirmReset = async () => {
    if (!canConfirmReset(selectedChildren.length, typed)) return;
    setResetting(true);
    try {
      const count = await familyService.resetChildren(selectedChildren.map((c) => c.id));
      setMessage(`🗑️ Progresso zerado: ${count} ${count === 1 ? 'criança' : 'crianças'}.`);
      setSelected(new Set());
      setResetOpen(false);
      setTyped('');
      await load();
    } catch (err) {
      setMessage(`❌ ${(err as Error).message || 'Não foi possível zerar.'}`);
      setResetOpen(false);
    } finally {
      setResetting(false);
    }
  };

  const logout = async () => {
    await authService.signOut();
    navigate('/');
  };

  if (!user || verified === null) return null;

  if (!verified) {
    return (
      <VerifyEmailScreen
        email={user.email}
        onVerified={() => {
          setVerified(true);
          void load();
        }}
        onBack={() => navigate('/inicio')}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <MinecraftButton variant="info" size="sm" onClick={() => navigate('/inicio')}>
            <ArrowLeft className="w-4 h-4 inline" aria-hidden="true" /> Voltar ao início
          </MinecraftButton>
          <span className="text-2xl" aria-hidden="true">👨‍👧</span>
          <div className="min-w-0">
            <h1 className="font-minecraft text-sm sm:text-base text-gray-900">Área dos Pais</h1>
            <p className="font-body text-xs text-gray-600 truncate">{user.name || user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MinecraftButton variant="secondary" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 inline" aria-hidden="true" /> Sair
          </MinecraftButton>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {!isFirebaseConfigured() && (
          <p className="p-3 bg-amber-50 border border-amber-300 rounded-md font-body text-sm text-amber-900">
            💡 <strong>Modo local:</strong> as contas e o progresso das crianças ficam salvos só neste aparelho.
            Conecte o Firebase para a criança entrar de qualquer aparelho.
          </p>
        )}

        {message && (
          <p role="status" className="p-3 bg-white border border-gray-300 rounded-md font-body text-sm text-gray-900">
            {message}
          </p>
        )}

        <SubscriptionCard />

        {showAdd ? (
          <section aria-labelledby="add-title" className="space-y-3">
            <MinecraftButton variant="secondary" size="sm" onClick={() => setShowAdd(false)}>
              <ArrowLeft className="w-4 h-4 inline" aria-hidden="true" /> Voltar para minhas crianças
            </MinecraftButton>
            <MinecraftCard>
              <div className="p-4 space-y-3">
                <h2 id="add-title" className="font-minecraft text-sm text-gray-800">
                  Cadastrar criança {children ? `(${children.length + 1} de ${MAX_CHILDREN})` : ''}
                </h2>
                <AddChildForm
                  onCancel={() => setShowAdd(false)}
                  onCreated={(name) => {
                    setShowAdd(false);
                    setMessage(`✅ Conta de ${name} criada. Ela já pode entrar na aba "Sou criança".`);
                    void load();
                  }}
                />
              </div>
            </MinecraftCard>
          </section>
        ) : (
        <section aria-labelledby="kids-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="kids-title" className="font-minecraft text-sm text-gray-800">
              Minhas crianças {children ? `(${children.length} de ${MAX_CHILDREN})` : ''}
            </h2>
            <div className="flex gap-2">
              <MinecraftButton variant="secondary" size="sm" onClick={() => void load()}>
                <RefreshCw className="w-4 h-4 inline" aria-hidden="true" /> Atualizar
              </MinecraftButton>
              {canAdd && (
                <MinecraftButton variant="success" size="sm" onClick={openAdd}>
                  <Plus className="w-4 h-4 inline" aria-hidden="true" /> Adicionar criança
                </MinecraftButton>
              )}
            </div>
          </div>

          {loadError && (
            <p role="alert" className="p-3 bg-red-50 border border-red-300 rounded-md font-body text-sm text-red-800">
              {loadError}
            </p>
          )}
          {!children && !loadError && <p className="font-body text-sm text-gray-600">Carregando…</p>}
          {children && children.length === 0 && (
            <MinecraftCard>
              <div className="p-6 text-center">
                <p className="font-body text-gray-800 mb-3">Nenhuma criança cadastrada ainda.</p>
                <MinecraftButton variant="gold" size="md" onClick={openAdd}>
                  ✨ Criar a primeira conta
                </MinecraftButton>
              </div>
            </MinecraftCard>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {children?.map((c) => (
              <ChildCard key={c.id} child={c} selected={selected.has(c.id)} onToggleSelect={() => toggle(c.id)} onChanged={() => void load()} />
            ))}
            {canAdd && children && children.length > 0 && (
              <button
                type="button"
                onClick={openAdd}
                className="min-h-[120px] rounded-md border-2 border-dashed border-gray-400 bg-white hover:bg-green-50 hover:border-green-500 flex flex-col items-center justify-center gap-1 p-4 font-body text-gray-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis"
              >
                <Plus className="w-8 h-8 text-green-700" aria-hidden="true" />
                <span className="font-bold">Cadastrar outra criança</span>
                <span className="text-xs text-gray-600">Ainda cabe {MAX_CHILDREN - children.length}</span>
              </button>
            )}
          </div>
          {children && !canAdd && (
            <p className="font-body text-xs text-gray-600">Limite de {MAX_CHILDREN} crianças por conta atingido.</p>
          )}
        </section>
        )}

        {!showAdd && children && children.length > 0 && (
          <section aria-labelledby="reset-title" className="bg-white border-2 border-red-200 rounded-md p-4">
            <h2 id="reset-title" className="font-minecraft text-sm text-red-800 mb-1">Zerar progresso</h2>
            <p className="font-body text-sm text-gray-700 mb-3">
              Marque as crianças acima. Zerar apaga tudo: fases, atividades, XP, nível, estrelas, conquistas, dias seguidos,
              itens da loja e roupa do personagem. <strong>Não dá para desfazer.</strong>
            </p>
            <MinecraftButton variant="danger" size="sm" disabled={selectedChildren.length === 0} onClick={() => setResetOpen(true)}>
              🗑️ Zerar {selectedChildren.length > 0 ? `(${selectedChildren.length})` : ''}
            </MinecraftButton>
          </section>
        )}

        {!showAdd && <TwoFactorCard />}
      </main>

      <Modal
        open={resetOpen}
        onClose={() => {
          setResetOpen(false);
          setTyped('');
        }}
        title="Zerar progresso"
      >
        <div className="p-5 space-y-3 font-body text-gray-900">
          <p className="bg-red-50 border border-red-300 text-red-900 rounded-md px-3 py-2 text-sm">
            ⚠️ Isto <strong>não pode ser desfeito</strong>. Estas crianças voltam à estaca zero:
          </p>
          <ul className="list-disc pl-5 text-sm">
            {selectedChildren.map((c) => (
              <li key={c.id}>
                {c.name} <span className="text-gray-600">({c.username})</span>
              </li>
            ))}
          </ul>
          <label className="block">
            <span className="text-sm font-bold block mb-1">
              Para confirmar, digite <strong>{RESET_WORD}</strong>
            </span>
            <input className={field} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" />
          </label>
          <div className="flex gap-2 justify-end">
            <MinecraftButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setResetOpen(false);
                setTyped('');
              }}
            >
              Cancelar
            </MinecraftButton>
            <MinecraftButton variant="danger" size="sm" disabled={!canConfirmReset(selectedChildren.length, typed) || resetting} onClick={confirmReset}>
              {resetting ? '⏳ Zerando…' : '🗑️ Zerar agora'}
            </MinecraftButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
