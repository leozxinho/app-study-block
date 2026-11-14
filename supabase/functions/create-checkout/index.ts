// Edge Function: abre o pagamento (Stripe Checkout) da assinatura do responsável logado.
// Deploy: supabase functions deploy create-checkout
// Segredos (supabase secrets set ...): STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, [STRIPE_PRICE_YEARLY],
//   [TRIAL_DAYS=7], APP_ORIGIN=https://seu-dominio
import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const ORIGIN = Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173';
const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'método não permitido' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return reply(401, { error: 'entre na sua conta de responsável' });
  if (user.app_metadata?.role === 'student') return reply(403, { error: 'só o responsável pode assinar' });

  let plan = 'monthly';
  try {
    const body = await req.json();
    if (body?.plan === 'yearly') plan = 'yearly';
  } catch {
    /* sem corpo: mensal */
  }
  const price = plan === 'yearly' ? Deno.env.get('STRIPE_PRICE_YEARLY') : Deno.env.get('STRIPE_PRICE_MONTHLY');
  if (!price) return reply(400, { error: plan === 'yearly' ? 'O plano anual ainda não está disponível.' : 'A assinatura ainda não está disponível.' });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: sub } = await admin.from('subscriptions').select('stripe_customer_id, status').eq('guardian_id', user.id).maybeSingle();

  // Um cliente Stripe por responsável (o id dele vai junto para o webhook saber de quem é)
  let customer = sub?.stripe_customer_id as string | undefined;
  if (!customer) {
    const created = await stripe.customers.create({ email: user.email, metadata: { guardian_id: user.id } });
    customer = created.id;
    await admin.from('subscriptions').upsert({ guardian_id: user.id, stripe_customer_id: customer, updated_at: new Date().toISOString() });
  }

  const trialDays = Number(Deno.env.get('TRIAL_DAYS') ?? '7');
  const alreadyTried = sub && sub.status !== 'none';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price, quantity: 1 }],
    subscription_data: {
      metadata: { guardian_id: user.id, plan },
      ...(trialDays > 0 && !alreadyTried ? { trial_period_days: trialDays } : {}),
    },
    locale: 'pt-BR',
    allow_promotion_codes: true,
    success_url: `${ORIGIN}/responsavel?assinatura=ok`,
    cancel_url: `${ORIGIN}/responsavel?assinatura=cancelada`,
  });
  return reply(200, { url: session.url });
});
