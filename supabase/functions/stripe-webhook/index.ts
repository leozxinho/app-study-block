// Edge Function: recebe os avisos do Stripe e atualiza a tabela subscriptions.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// No Stripe (Developers > Webhooks), aponte para https://<projeto>.supabase.co/functions/v1/stripe-webhook
// com os eventos customer.subscription.created/updated/deleted.
// Segredos: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('sem assinatura', { status: 400 });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    // Confere que o aviso veio mesmo do Stripe (assinatura com o segredo do webhook)
    event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, cryptoProvider);
  } catch {
    return new Response('assinatura inválida', { status: 400 });
  }

  if (!event.type.startsWith('customer.subscription.')) return new Response('ignorado', { status: 200 });

  const sub = event.data.object as Stripe.Subscription;
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // De quem é: metadata da assinatura, ou o cliente já ligado ao responsável
  let guardianId = sub.metadata?.guardian_id;
  if (!guardianId) {
    const { data } = await admin.from('subscriptions').select('guardian_id').eq('stripe_customer_id', customer).maybeSingle();
    guardianId = data?.guardian_id;
  }
  if (!guardianId) return new Response('responsável não encontrado', { status: 200 });

  const periodEnd = sub.items?.data?.[0]?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const { error } = await admin.from('subscriptions').upsert({
    guardian_id: guardianId,
    status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
    plan: sub.metadata?.plan ?? null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    stripe_customer_id: customer,
    stripe_subscription_id: sub.id,
    updated_at: new Date().toISOString(),
  });
  if (error) return new Response('erro ao salvar', { status: 500 });
  return new Response('ok', { status: 200 });
});
