// Edge Function: abre o portal do Stripe para o responsável trocar o cartão, ver faturas ou cancelar.
// Deploy: supabase functions deploy customer-portal
// No Stripe (Settings > Billing > Customer portal), ative o portal e escolha o que o cliente pode fazer.
// Segredos: STRIPE_SECRET_KEY, APP_ORIGIN=https://seu-dominio
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
  if (!user) return reply(401, { error: 'Entre na sua conta de responsável.' });
  if (user.app_metadata?.role === 'student') return reply(403, { error: 'Só o responsável pode mexer na assinatura.' });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: sub } = await admin.from('subscriptions').select('stripe_customer_id').eq('guardian_id', user.id).maybeSingle();
  if (!sub?.stripe_customer_id) return reply(404, { error: 'Você ainda não tem assinatura.' });

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    locale: 'pt-BR',
    return_url: `${ORIGIN}/responsavel`,
  });
  return reply(200, { url: session.url });
});
