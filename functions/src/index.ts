/**
 * Cloud Functions do StudyBlock: só a assinatura (Stripe). Exigem o plano Blaze.
 * O cadastro das crianças, o zerar e os ajustes rodam sem servidor (firestore.rules), no plano Spark.
 *
 * - createCheckout: abre o pagamento; customerPortal: cartão, faturas, cancelar;
 * - stripeWebhook: recebe os avisos do Stripe e grava subscriptions/{responsável}.
 *
 * Deploy (no Blaze): firebase deploy --only functions
 * Segredos: firebase functions:secrets:set STRIPE_SECRET_KEY (e STRIPE_WEBHOOK_SECRET)
 * Parâmetros (functions/.env ou perguntados no deploy): APP_ORIGIN, STRIPE_PRICE_MONTHLY,
 *   STRIPE_PRICE_YEARLY, TRIAL_DAYS, CHILD_EMAIL_DOMAIN
 */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall, onRequest, type CallableRequest } from 'firebase-functions/v2/https';
import { defineInt, defineSecret, defineString } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import Stripe from 'stripe';

initializeApp();
const db = getFirestore();

// Região igual a VITE_FIREBASE_REGION no app
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 10 });

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const APP_ORIGIN = defineString('APP_ORIGIN', { default: 'http://localhost:5173' });
const STRIPE_PRICE_MONTHLY = defineString('STRIPE_PRICE_MONTHLY', { default: '' });
const STRIPE_PRICE_YEARLY = defineString('STRIPE_PRICE_YEARLY', { default: '' });
const TRIAL_DAYS = defineInt('TRIAL_DAYS', { default: 7 });
// Mesmo domínio que o app usa no login da criança (VITE_CHILD_EMAIL_DOMAIN). Nenhum e-mail é enviado.
const CHILD_EMAIL_DOMAIN = defineString('CHILD_EMAIL_DOMAIN', { default: 'crianca.minelearn.app' });

/** Responsável logado (conta de criança não passa). Devolve o uid. */
async function requireGuardian(req: CallableRequest, message = 'Só o responsável pode fazer isso.'): Promise<string> {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Entre na sua conta de responsável.');
  // Conta de criança: e-mail no domínio interno e ficha em children/{uid}
  const email = typeof req.auth.token.email === 'string' ? req.auth.token.email : '';
  if (email.endsWith(`@${CHILD_EMAIL_DOMAIN.value()}`)) throw new HttpsError('permission-denied', message);
  const isChild = await db.doc(`children/${req.auth.uid}`).get();
  if (isChild.exists) throw new HttpsError('permission-denied', message);
  return req.auth.uid;
}

// ---------------------------------------------------------------------------
// Assinatura (Stripe)
// ---------------------------------------------------------------------------

const stripeClient = () => new Stripe(STRIPE_SECRET_KEY.value());

/** Abre o pagamento (Stripe Checkout) da assinatura do responsável logado. */
export const createCheckout = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const guardianId = await requireGuardian(req, 'Só o responsável pode assinar.');
  const plan = (req.data as { plan?: unknown })?.plan === 'yearly' ? 'yearly' : 'monthly';
  const price = plan === 'yearly' ? STRIPE_PRICE_YEARLY.value() : STRIPE_PRICE_MONTHLY.value();
  if (!price) {
    throw new HttpsError('failed-precondition', plan === 'yearly' ? 'O plano anual ainda não está disponível.' : 'A assinatura ainda não está disponível.');
  }

  const stripe = stripeClient();
  const ref = db.doc(`subscriptions/${guardianId}`);
  const sub = (await ref.get()).data() as { stripeCustomerId?: string; status?: string } | undefined;

  // Um cliente Stripe por responsável (o id dele vai junto para o webhook saber de quem é)
  let customer = sub?.stripeCustomerId;
  if (!customer) {
    const created = await stripe.customers.create({
      email: typeof req.auth?.token.email === 'string' ? req.auth.token.email : undefined,
      metadata: { guardian_id: guardianId },
    });
    customer = created.id;
    await ref.set({ status: sub?.status ?? 'none', stripeCustomerId: customer, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  const trialDays = TRIAL_DAYS.value();
  const alreadyTried = !!sub?.status && sub.status !== 'none';
  const origin = APP_ORIGIN.value();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price, quantity: 1 }],
    subscription_data: {
      metadata: { guardian_id: guardianId, plan },
      ...(trialDays > 0 && !alreadyTried ? { trial_period_days: trialDays } : {}),
    },
    locale: 'pt-BR',
    allow_promotion_codes: true,
    success_url: `${origin}/responsavel?assinatura=ok`,
    cancel_url: `${origin}/responsavel?assinatura=cancelada`,
  });
  return { url: session.url };
});

/** Abre o portal do Stripe (trocar cartão, ver faturas, cancelar). */
export const customerPortal = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const guardianId = await requireGuardian(req, 'Só o responsável pode mexer na assinatura.');
  const sub = (await db.doc(`subscriptions/${guardianId}`).get()).data() as { stripeCustomerId?: string } | undefined;
  if (!sub?.stripeCustomerId) throw new HttpsError('not-found', 'Você ainda não tem assinatura.');
  const session = await stripeClient().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    locale: 'pt-BR',
    return_url: `${APP_ORIGIN.value()}/responsavel`,
  });
  return { url: session.url };
});

/**
 * Recebe os avisos do Stripe e atualiza subscriptions/{responsável}.
 * No Stripe (Developers > Webhooks), aponte para a URL desta função
 * com os eventos customer.subscription.created/updated/deleted.
 */
export const stripeWebhook = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  const signature = req.get('Stripe-Signature');
  if (req.method !== 'POST' || !signature) {
    res.status(400).send('sem assinatura');
    return;
  }

  const stripe = stripeClient();
  let event: Stripe.Event;
  try {
    // Confere que o aviso veio mesmo do Stripe (assinatura com o segredo do webhook)
    event = stripe.webhooks.constructEvent(req.rawBody, signature, STRIPE_WEBHOOK_SECRET.value());
  } catch {
    res.status(400).send('assinatura inválida');
    return;
  }

  if (!event.type.startsWith('customer.subscription.')) {
    res.status(200).send('ignorado');
    return;
  }

  const sub = event.data.object as Stripe.Subscription;
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  // De quem é: metadata da assinatura, ou o cliente já ligado ao responsável
  let guardianId = sub.metadata?.guardian_id;
  if (!guardianId) {
    const found = await db.collection('subscriptions').where('stripeCustomerId', '==', customer).limit(1).get();
    guardianId = found.docs[0]?.id;
  }
  if (!guardianId) {
    res.status(200).send('responsável não encontrado');
    return;
  }

  const periodEnd =
    (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  try {
    await db.doc(`subscriptions/${guardianId}`).set(
      {
        status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
        plan: sub.metadata?.plan ?? null,
        currentPeriodEnd: periodEnd ? Timestamp.fromMillis(periodEnd * 1000) : null,
        stripeCustomerId: customer,
        stripeSubscriptionId: sub.id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    logger.error('stripeWebhook: salvar', err);
    res.status(500).send('erro ao salvar');
    return;
  }
  res.status(200).send('ok');
});
