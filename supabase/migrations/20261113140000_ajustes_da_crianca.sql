-- MineLearn: ajustes que o responsável muda na conta da criança (Área dos Pais).
-- Só aceita chaves conhecidas, com valores validados, e só para crianças do responsável logado.

create or replace function public.set_child_settings(child uuid, patch jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  clean jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;
  if patch ? 'unlockAll' then
    if jsonb_typeof(patch -> 'unlockAll') <> 'boolean' then
      raise exception 'unlockAll inválido' using errcode = '22023';
    end if;
    clean := clean || jsonb_build_object('unlockAll', patch -> 'unlockAll');
  end if;
  if patch ? 'dailyGoal' then
    if jsonb_typeof(patch -> 'dailyGoal') <> 'number'
       or (patch ->> 'dailyGoal')::numeric not between 1 and 10 then
      raise exception 'dailyGoal inválido' using errcode = '22023';
    end if;
    clean := clean || jsonb_build_object('dailyGoal', round((patch ->> 'dailyGoal')::numeric));
  end if;
  if clean = '{}'::jsonb then
    return false;
  end if;

  update public.child_state s
     set state = jsonb_set(
           s.state, '{slices,settings}',
           coalesce(s.state #> '{slices,settings}', '{}'::jsonb) || clean, true),
         revision = s.revision + 1,
         updated_at = now()
   where s.child_id = child
     and exists (select 1 from public.children c where c.id = s.child_id and c.guardian_id = auth.uid());
  return found;
end;
$$;

revoke all on function public.set_child_settings(uuid, jsonb) from public, anon;
grant execute on function public.set_child_settings(uuid, jsonb) to authenticated;
