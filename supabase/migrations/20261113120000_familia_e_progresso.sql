-- MineLearn: contas de responsável → criança e progresso da criança (store único).
-- Versionado no repositório; aplicar com `supabase db push` depois de conectar o projeto.
-- Não altera as tabelas antigas (student_progress, student_xp, student_level_progress).

-- Crianças de cada responsável. A conta da criança (auth.users) é criada pela
-- Edge Function create-child; o app nunca insere aqui direto.
create table if not exists public.children (
  id uuid primary key references auth.users (id) on delete cascade,
  guardian_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  username text not null unique check (username ~ '^[a-z0-9._-]{3,20}$'),
  age_group text not null check (age_group in ('bercario', 'maternal', 'pre-escola-1', 'pre-escola-2', 'fundamental-1', 'fundamental-2')),
  created_at timestamptz not null default now(),
  check (id <> guardian_id)
);
create index if not exists children_guardian_idx on public.children (guardian_id);

alter table public.children enable row level security;

-- Responsável vê as crianças dele; a criança vê o próprio cadastro. Sem insert/update/delete pelo app.
create policy children_select_guardian on public.children
  for select to authenticated using (guardian_id = auth.uid());
create policy children_select_self on public.children
  for select to authenticated using (id = auth.uid());

-- Progresso da criança: um documento JSON (fatias aventura, progresso, jogo, ajustes).
-- revision cresce a cada gravação: o app grava só se a revisão não mudou
-- (assim um "zerar" do responsável não é desfeito por um aparelho com dados velhos).
create table if not exists public.child_state (
  child_id uuid primary key references public.children (id) on delete cascade,
  state jsonb not null default jsonb_build_object('v', 1, 'slices', '{}'::jsonb, 'updatedAt', now()),
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.child_state enable row level security;

-- A criança lê e grava só a própria linha (a FK impede o responsável de criar linha para si).
create policy child_state_select_self on public.child_state
  for select to authenticated using (child_id = auth.uid());
create policy child_state_insert_self on public.child_state
  for insert to authenticated with check (child_id = auth.uid());
create policy child_state_update_self on public.child_state
  for update to authenticated using (child_id = auth.uid()) with check (child_id = auth.uid());
-- O responsável só lê; mudanças dele passam pelas funções abaixo, que conferem o vínculo.
create policy child_state_select_guardian on public.child_state
  for select to authenticated using (
    exists (select 1 from public.children c where c.id = child_state.child_id and c.guardian_id = auth.uid())
  );

-- Zerar (irreversível): volta as crianças escolhidas à estaca zero.
-- Só afeta crianças do responsável logado; devolve quantas foram zeradas.
create or replace function public.reset_children(child_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;
  update public.child_state s
     set state = jsonb_build_object('v', 1, 'slices', '{}'::jsonb, 'updatedAt', now()),
         revision = s.revision + 1,
         updated_at = now()
   where s.child_id = any (child_ids)
     and exists (select 1 from public.children c where c.id = s.child_id and c.guardian_id = auth.uid());
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Liberar (ou bloquear de novo) todos os mundos e fases de uma criança do responsável.
create or replace function public.set_child_unlock_all(child uuid, unlocked boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;
  update public.child_state s
     set state = jsonb_set(
           jsonb_set(s.state, '{slices,settings}', coalesce(s.state #> '{slices,settings}', '{}'::jsonb), true),
           '{slices,settings,unlockAll}', to_jsonb(unlocked), true),
         revision = s.revision + 1,
         updated_at = now()
   where s.child_id = child
     and exists (select 1 from public.children c where c.id = s.child_id and c.guardian_id = auth.uid());
  return found;
end;
$$;

revoke all on function public.reset_children(uuid[]) from public, anon;
revoke all on function public.set_child_unlock_all(uuid, boolean) from public, anon;
grant execute on function public.reset_children(uuid[]) to authenticated;
grant execute on function public.set_child_unlock_all(uuid, boolean) to authenticated;
