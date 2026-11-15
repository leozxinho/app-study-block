import { useEffect, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck } from 'lucide-react';
import { MinecraftButton } from './MinecraftButton';
import { RecentLoginRequiredError, twoFactorError, twoFactorService, type TotpSetup } from '../../services/twoFactorService';

type Step = 'idle' | 'reauth' | 'setup' | 'confirmOff';

const field =
  'w-full px-3 py-2 pixel-border bg-gray-50 font-body text-base text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-lapis/50';

/** Área dos Pais: ligar/desligar a verificação em duas etapas com app autenticador. */
export function TwoFactorCard() {
  const [enabled, setEnabled] = useState(() => twoFactorService.isEnabled());
  const [step, setStep] = useState<Step>('idle');
  /** O que fazer depois de confirmar a identidade */
  const [after, setAfter] = useState<'on' | 'off'>('on');
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [qr, setQr] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!setup) return;
    let alive = true;
    QRCode.toDataURL(setup.url, { width: 220, margin: 1 })
      .then((data) => alive && setQr(data))
      .catch(() => alive && setQr(''));
    return () => {
      alive = false;
    };
  }, [setup]);

  if (!twoFactorService.isAvailable()) return null;
  const usesPassword = twoFactorService.usesPassword();

  const reset = () => {
    setStep('idle');
    setSetup(null);
    setQr('');
    setPassword('');
    setCode('');
    setError('');
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      if (err instanceof RecentLoginRequiredError) {
        setStep('reauth');
        return;
      }
      setError(twoFactorError(err));
    } finally {
      setBusy(false);
    }
  };

  const begin = () =>
    run(async () => {
      setNote('');
      setAfter('on');
      setSetup(await twoFactorService.startSetup());
      setStep('setup');
    });

  const turnOff = () =>
    run(async () => {
      await twoFactorService.disable();
      setEnabled(false);
      reset();
      setNote('Verificação em duas etapas desligada.');
    });

  const confirmSetup = (e: FormEvent) => {
    e.preventDefault();
    if (!setup) return;
    void run(async () => {
      await twoFactorService.finishSetup(setup, code);
      setEnabled(true);
      reset();
      setNote('✅ Pronto! A partir de agora, ao entrar, o app vai pedir o código do app autenticador.');
    });
  };

  const confirmIdentity = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await twoFactorService.reauthenticate(usesPassword ? password : null, code || undefined);
      setPassword('');
      setCode('');
      if (after === 'on') {
        setSetup(await twoFactorService.startSetup());
        setStep('setup');
      } else {
        await twoFactorService.disable();
        setEnabled(false);
        reset();
        setNote('Verificação em duas etapas desligada.');
      }
    });
  };

  const codeInput = (label: string) => (
    <label className="block">
      <span className="font-body text-sm font-bold text-gray-800 block mb-1">{label}</span>
      <input
        className={`${field} tracking-[0.4em] text-center`}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
      />
    </label>
  );

  return (
    <section aria-labelledby="security-title" className="bg-white border-2 border-gray-200 rounded-md p-4 space-y-3 font-body text-gray-900">
      <div className="flex items-start gap-3">
        <ShieldCheck className={`w-6 h-6 shrink-0 ${enabled ? 'text-green-700' : 'text-gray-500'}`} aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="security-title" className="font-minecraft text-sm text-gray-800">
            Verificação em duas etapas {enabled ? '· ligada' : '· desligada'}
          </h2>
          <p className="text-sm text-gray-700">
            {enabled
              ? 'Ao entrar, além da senha, o app pede o código do seu app autenticador.'
              : 'Proteja a Área dos Pais: além da senha, peça um código do app autenticador (Google Authenticator, Authy, Microsoft Authenticator).'}
          </p>
        </div>
      </div>

      {note && (
        <p role="status" className="text-sm bg-green-50 border border-green-300 rounded-md px-3 py-2">
          {note}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm bg-red-50 border border-red-300 text-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {step === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {enabled ? (
            <MinecraftButton variant="secondary" size="sm" disabled={busy} onClick={() => setStep('confirmOff')}>
              Desligar
            </MinecraftButton>
          ) : (
            <MinecraftButton variant="success" size="sm" disabled={busy} onClick={begin}>
              {busy ? '⏳ Preparando…' : '🛡️ Ligar verificação em duas etapas'}
            </MinecraftButton>
          )}
        </div>
      )}

      {step === 'confirmOff' && (
        <div className="space-y-2">
          <p className="text-sm">Desligar deixa a Área dos Pais protegida só pela senha. Continuar?</p>
          <div className="flex flex-wrap gap-2">
            <MinecraftButton
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => {
                setAfter('off');
                void turnOff();
              }}
            >
              Sim, desligar
            </MinecraftButton>
            <MinecraftButton variant="secondary" size="sm" onClick={reset}>
              Cancelar
            </MinecraftButton>
          </div>
        </div>
      )}

      {step === 'reauth' && (
        <form onSubmit={confirmIdentity} className="space-y-3">
          <p className="text-sm">Por segurança, confirme que é você.</p>
          {usesPassword && (
            <label className="block">
              <span className="font-body text-sm font-bold text-gray-800 block mb-1">Sua senha</span>
              <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
          )}
          {enabled && codeInput('Código do app autenticador')}
          <div className="flex flex-wrap gap-2">
            <MinecraftButton variant="success" size="sm" disabled={busy || (usesPassword && !password) || (enabled && code.length !== 6)}>
              {busy ? '⏳ Conferindo…' : usesPassword ? 'Confirmar' : 'Confirmar com Google'}
            </MinecraftButton>
            <MinecraftButton type="button" variant="secondary" size="sm" onClick={reset}>
              Cancelar
            </MinecraftButton>
          </div>
        </form>
      )}

      {step === 'setup' && setup && (
        <form onSubmit={confirmSetup} className="space-y-3">
          <ol className="list-decimal pl-5 text-sm space-y-1">
            <li>Instale um app autenticador no seu celular (Google Authenticator, Authy ou Microsoft Authenticator).</li>
            <li>No app, toque em “+” e leia o QR code abaixo (ou digite a chave).</li>
            <li>Digite o código de 6 números que aparecer.</li>
          </ol>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {qr ? (
              <img src={qr} alt="QR code para o app autenticador" width={180} height={180} className="border border-gray-300 rounded-md bg-white" />
            ) : (
              <div className="w-[180px] h-[180px] grid place-items-center text-sm text-gray-600 border border-gray-300 rounded-md">Gerando…</div>
            )}
            <div className="text-sm space-y-2 min-w-0">
              <p>
                Chave: <code className="break-all bg-gray-100 px-1 rounded">{setup.key}</code>
              </p>
              <p>
                No celular?{' '}
                <a href={setup.url} className="text-blue-700 underline">
                  Abrir no app autenticador
                </a>
              </p>
            </div>
          </div>
          {codeInput('Código de 6 números')}
          <div className="flex flex-wrap gap-2">
            <MinecraftButton variant="success" size="sm" disabled={busy || code.length !== 6}>
              {busy ? '⏳ Conferindo…' : 'Ligar'}
            </MinecraftButton>
            <MinecraftButton type="button" variant="secondary" size="sm" onClick={reset}>
              Cancelar
            </MinecraftButton>
          </div>
        </form>
      )}
    </section>
  );
}
