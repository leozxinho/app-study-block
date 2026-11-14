-- MineLearn: assinatura do responsável (Stripe). Escrita só pelo servidor (webhook com service role).

create table if not exists public.subscriptions (
  guardian_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'none'
    check (status in ('none', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
  plan text,
  current_period_end timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- O responsável vê a própria assinatura
create policy subscriptions_select_guardian on public.subscriptions
  for select to authenticated using (guardian_id = auth.uid());

-- A criança vê a assinatura do responsável dela (para saber se pode jogar)
create policy subscriptions_select_child on public.subscriptions
  for select to authenticated using (
    exists (select 1 from public.children c where c.id = auth.uid() and c.guardian_id = subscriptions.guardian_id)
  );
-- Sem insert/update/delete pelo app: só as Edge Functions (service role) escrevem.
