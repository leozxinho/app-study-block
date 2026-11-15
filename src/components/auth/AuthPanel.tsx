import { useState, type FormEvent } from 'react';
import { KeyRound, Lock, Mail, User as UserIcon } from 'lucide-react';
import { MinecraftButton } from '../ui/MinecraftButton';
import { authService, TwoFactorRequiredError } from '../../services/authService';
import type { MultiFactorResolver } from 'firebase/auth';
import { listSavedProfiles } from '../../services/savedProfiles';
import { DEFAULT_SKIN, Mob, type PlayerSkin } from '../mobs';
import { isFirebaseConfigured } from '../../lib/firebase';

type Tab = 'entrar' | 'criar' | 'crianca';

interface AuthPanelProps {
  /** Entrou (ou criou o acesso) com sucesso */
  onSuccess: () => void;
  initialTab?: Tab;
}

/** Traduz os erros mais comuns do Firebase (e os do modo local). */
function friendlyError(err: unknown): string {
  const { code = '', message: msg = '' } = (err ?? {}) as { code?: string; message?: string };
  if (/auth\/(invalid-credential|wrong-password|user-not-found|invalid-email|user-disabled)/.test(code)) return 'Login ou senha incorretos.';
  if (code === 'auth/email-already-in-use') return 'Esse e-mail já tem acesso. Use a aba "Entrar".';
  if (code === 'auth/weak-password') return 'A senha precisa ter pelo menos 6 caracteres.';
  if (code === 'auth/operation-not-allowed') return 'Esse jeito de entrar ainda não foi ativado no Firebase.';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'A janela do Google foi fechada antes de terminar.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (code === 'auth/invalid-verification-code' || code === 'auth/missing-code')
    return 'Código incorreto. Digite o código que aparece agora no app autenticador.';
  if (code === 'auth/network-request-failed') return 'Sem internet. Confira a conexão e tente de novo.';
  if (/invalid login credentials/i.test(msg)) return 'Login ou senha incorretos.';
  if (/already registered|already exists/i.test(msg)) return 'Esse e-mail já tem acesso. Use a aba "Entrar".';
  if (/password.*(6|characters)/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).';
  return msg || 'Não deu certo. Tente de novo.';
}

/** Logo "G" do Google (usado no botão padrão "Entrar com Google"). */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const input =
  'w-full pl-10 pr-4 py-3 pixel-border bg-gray-50 font-body text-base text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-lapis/50';

/** Responsável: Google, e-mail ou criar conta. Criança: login e senha criados pelo responsável. */
export function AuthPanel({ onSuccess, initialTab = 'entrar' }: AuthPanelProps) {
  // Se há crianças lembradas neste aparelho, abre direto na aba "Sou criança"
  const [tab, setTab] = useState<Tab>(() => (initialTab === 'entrar' && listSavedProfiles().length > 0 ? 'crianca' : initialTab));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const demo = !isFirebaseConfigured();
  const child = tab === 'crianca';
  const [saved, setSaved] = useState(() => listSavedProfiles());
  /** Login com 2FA: falta o código do app autenticador */
  const [twoFactor, setTwoFactor] = useState<MultiFactorResolver | null>(null);
  const [code, setCode] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      if (err instanceof TwoFactorRequiredError) {
        setCode('');
        setTwoFactor(err.resolver);
        return;
      }
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () =>
    run(async () => {
      const { redirected } = await authService.signInWithGoogle();
      if (!redirected) onSuccess(); // janela bloqueada: o navegador vai para o Google e volta aqui
    });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (tab === 'crianca') {
        await authService.signInChild(email, password);
        onSuccess();
        return;
      }
      if (tab === 'entrar') {
        await authService.signIn(email, password);
        onSuccess();
        return;
      }
      if (password.length < 6) throw new Error('password 6');
      await authService.signUp(email, password, name.trim());
      onSuccess();
    });
  };

  if (twoFactor) {
    const submitCode = (e: FormEvent) => {
      e.preventDefault();
      run(async () => {
        await authService.completeTwoFactor(twoFactor, code);
        setTwoFactor(null);
        onSuccess();
      });
    };
    return (
      <div className="p-6 sm:p-8">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2" aria-hidden="true">🛡️</div>
          <p className="font-minecraft text-base sm:text-lg text-gray-900">Verificação em duas etapas</p>
          <p className="font-body text-sm text-gray-700 mt-1">Abra o app autenticador e digite o código de 6 números do StudyBlock.</p>
        </div>
        {error && <p role="alert" className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-md mb-4 text-sm font-body">{error}</p>}
        <form onSubmit={submitCode} className="space-y-4">
          <label className="block">
            <span className="sr-only">Código do app autenticador</span>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" aria-hidden="true" />
              <input
                className={`${input} tracking-[0.4em] text-center`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
              />
            </div>
          </label>
          <MinecraftButton variant="success" size="lg" fullWidth disabled={loading || code.length !== 6}>
            {loading ? '⏳ Conferindo…' : 'Entrar'}
          </MinecraftButton>
          <button
            type="button"
            onClick={() => {
              setTwoFactor(null);
              setError('');
            }}
            className="w-full font-body text-sm text-gray-700 underline"
          >
            Voltar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-5">
        <div className="text-4xl mb-2" aria-hidden="true">{child ? '🧒' : '🔐'}</div>
        <p className="font-minecraft text-base sm:text-lg text-gray-900">{child ? 'Entrar como criança' : 'Área dos Pais'}</p>
        <p className="font-body text-sm text-gray-700 mt-1">
          {child
            ? 'Use o login e a senha que o seu responsável criou.'
            : 'Entre para criar a conta das crianças e acompanhar o progresso.'}
        </p>
      </div>

      {!child && (
        <>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full min-h-[52px] flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-md font-body font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis"
      >
        <GoogleLogo />
        Entrar com Google
      </button>

      <div className="flex items-center gap-3 my-5" aria-hidden="true">
        <span className="h-px bg-gray-300 flex-1" />
        <span className="font-body text-xs text-gray-600">ou com e-mail</span>
        <span className="h-px bg-gray-300 flex-1" />
      </div>
        </>
      )}

      {/* Abas */}
      <div role="tablist" aria-label="Forma de acesso" className="grid grid-cols-3 gap-2 mb-4">
        {([['entrar', 'Entrar'], ['criar', 'Criar conta'], ['crianca', '🧒 Sou criança']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => { setTab(id); setError(''); }}
            className={`min-h-[44px] rounded-md font-body font-bold text-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis
              ${tab === id ? 'bg-brand-dark-green text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-md mb-4 text-sm font-body">{error}</p>}
      {info && <p role="status" className="bg-green-100 border border-green-300 text-green-900 px-4 py-2 rounded-md mb-4 text-sm font-body">{info}</p>}

      {/* Crianças lembradas neste aparelho: toca no personagem e entra */}
      {child && saved.length > 0 && (
        <div className="mb-5">
          <p className="font-body text-sm font-bold text-gray-800 mb-2 text-center">Quem vai jogar?</p>
          <ul className="grid grid-cols-3 gap-2">
            {saved.map((p) => (
              <li key={p.id} className="relative">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    run(async () => {
                      await authService.signInSaved(p);
                      onSuccess();
                    })
                  }
                  className="w-full rounded-lg pixel-border bg-gradient-to-b from-sky-100 to-green-100 hover:from-sky-200 p-2 flex flex-col items-center gap-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis"
                >
                  <Mob type={(p.skin?.character as PlayerSkin['character']) ?? 'steve'} skin={{ ...DEFAULT_SKIN, ...p.skin } as PlayerSkin} size={40} animation="idle" />
                  <span className="font-body text-sm font-bold text-gray-900 truncate max-w-full">{p.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void authService.forgetSavedProfile(p).finally(() => setSaved(listSavedProfiles()));
                    setSaved(listSavedProfiles());
                  }}
                  aria-label={`Esquecer ${p.name} neste aparelho`}
                  title="Esquecer neste aparelho"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-300 text-xs text-gray-600 hover:bg-red-50"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <p className="font-body text-xs text-gray-600 text-center mt-3">Ou entre com login e senha:</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" role="tabpanel">
        {tab === 'criar' && (
          <>
            <label className="block">
              <span className="font-body text-sm font-bold text-gray-800 block mb-1">Seu nome</span>
              <span className="relative block">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Maria Silva" className={input} />
              </span>
            </label>
          </>
        )}

        <label className="block">
          <span className="font-body text-sm font-bold text-gray-800 block mb-1">{child ? 'Login' : 'E-mail'}</span>
          <span className="relative block">
            {child ? (
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            ) : (
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            )}
            <input
              type={child ? 'text' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={child ? 'ana.souza' : 'voce@email.com'}
              className={input}
            />
          </span>
        </label>

        <label className="block">
          <span className="font-body text-sm font-bold text-gray-800 block mb-1">
            Senha{tab === 'criar' && <span className="font-normal text-gray-600"> (mínimo 6 caracteres)</span>}
          </span>
          <span className="relative block">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={tab === 'criar' ? 6 : undefined}
              autoComplete={tab === 'criar' ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              className={input}
            />
          </span>
        </label>

        <MinecraftButton variant="gold" size="lg" fullWidth>
          {loading ? '⏳ Aguarde...' : tab === 'criar' ? '✨ Criar conta' : '⚔️ Entrar'}
        </MinecraftButton>
      </form>

      {demo && (
        <p className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-md font-body text-xs text-center text-amber-900">
          💡 <strong>Modo local</strong> (sem Firebase): as contas, as senhas e o progresso ficam salvos só neste aparelho. Crie a conta do responsável uma vez; o "Entrar com Google" é simulado.
        </p>
      )}
    </div>
  );
}
