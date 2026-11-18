/**
 * Verificação em duas etapas (2FA) do responsável, com app autenticador (TOTP: Google Authenticator,
 * Authy, Microsoft Authenticator...). Opcional; contas de criança não usam.
 * Exige no projeto: Firebase Authentication com Identity Platform e o TOTP ativado (ver docs/firebase.md).
 */
import {
  EmailAuthProvider,
  getMultiFactorResolver,
  GoogleAuthProvider,
  multiFactor,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorInfo,
  type TotpSecret,
  type User as FirebaseUser,
} from 'firebase/auth';
import { activeAuth, isFirebaseConfigured } from '../lib/firebase';

export const TOTP_ISSUER = 'StudyBlock';

/** O Firebase pede login recente para ligar ou desligar o 2FA. */
export class RecentLoginRequiredError extends Error {
  constructor() {
    super('Confirme sua identidade para continuar.');
    this.name = 'RecentLoginRequiredError';
  }
}

export interface TotpSetup {
  secret: TotpSecret;
  /** otpauth://... (vira QR code; no celular, tocar abre o app autenticador) */
  url: string;
  /** Chave para digitar à mão no app */
  key: string;
}

function currentUser(): FirebaseUser {
  const user = activeAuth()?.currentUser;
  if (!user) throw new Error('Entre na conta do responsável.');
  return user;
}

function totpFactor(user: FirebaseUser): MultiFactorInfo | undefined {
  return multiFactor(user).enrolledFactors.find((f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
}

const isRecentLoginError = (err: unknown) => (err as { code?: string })?.code === 'auth/requires-recent-login';

/** Mensagens em português para os erros mais comuns. */
export function twoFactorError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/invalid-verification-code' || code === 'auth/invalid-credential' || code === 'auth/missing-code')
    return 'Código incorreto. Confira o app autenticador e digite o código que aparece agora.';
  if (code === 'auth/wrong-password') return 'Senha incorreta.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Espere alguns minutos.';
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation')
    return 'A verificação em duas etapas ainda não foi ativada no Firebase deste projeto.';
  if (code === 'auth/unverified-email') return 'Confirme seu e-mail antes de ativar.';
  if (code === 'auth/popup-closed-by-user') return 'A janela do Google foi fechada antes de terminar.';
  if (code === 'auth/unauthorized-domain')
    return 'Este endereço do site não está autorizado no Firebase (Authentication > Settings > Domínios autorizados).';
  if (err instanceof RecentLoginRequiredError) return err.message;
  return 'Não deu certo. Tente de novo.';
}

export const twoFactorService = {
  /** Dá para usar 2FA nesta conta? (Firebase ligado e responsável logado) */
  isAvailable(): boolean {
    return isFirebaseConfigured() && !!activeAuth()?.currentUser;
  },

  isEnabled(): boolean {
    const user = activeAuth()?.currentUser;
    return !!user && !!totpFactor(user);
  },

  /** Conta entra com senha (pede a senha para confirmar) ou só com Google (abre o Google). */
  usesPassword(): boolean {
    return currentUser().providerData.some((p) => p.providerId === 'password');
  },

  /**
   * Confirma a identidade (login recente). Se a conta já tem 2FA, o Firebase também pede o código:
   * passe `code` para resolver na mesma hora.
   */
  async reauthenticate(password: string | null, code?: string): Promise<void> {
    const user = currentUser();
    const auth = activeAuth()!;
    try {
      if (password !== null) {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? '', password));
      } else {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }
    } catch (err) {
      if ((err as { code?: string })?.code !== 'auth/multi-factor-auth-required') throw err;
      if (!code) throw new Error('Digite o código do app autenticador.');
      const resolver = getMultiFactorResolver(auth, err as MultiFactorError);
      const hint = resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
      if (!hint) throw err;
      await resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim()));
    }
  },

  /** 1º passo: gera a chave secreta e o QR code. Pode lançar RecentLoginRequiredError. */
  async startSetup(): Promise<TotpSetup> {
    const user = currentUser();
    try {
      const session = await multiFactor(user).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      return { secret, url: secret.generateQrCodeUrl(user.email ?? 'responsavel', TOTP_ISSUER), key: secret.secretKey };
    } catch (err) {
      if (isRecentLoginError(err)) throw new RecentLoginRequiredError();
      throw err;
    }
  },

  /** 2º passo: confere o código de 6 dígitos do app e liga o 2FA. */
  async finishSetup(setup: TotpSetup, code: string): Promise<void> {
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(setup.secret, code.trim());
    await multiFactor(currentUser()).enroll(assertion, 'App autenticador');
  },

  /** Desliga o 2FA. Pode lançar RecentLoginRequiredError (confirme a identidade e tente de novo). */
  async disable(): Promise<void> {
    const user = currentUser();
    const factor = totpFactor(user);
    if (!factor) return;
    try {
      await multiFactor(user).unenroll(factor);
    } catch (err) {
      if (isRecentLoginError(err)) throw new RecentLoginRequiredError();
      throw err;
    }
  },
};
