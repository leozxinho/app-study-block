-- MineLearn: o responsável também escolhe o tempo de tela por dia (minutos; 0 = sem limite).
-- Substitui set_child_settings acrescentando a chave screenTimeMin (mesmas regras de acesso).

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
  if patch ? 'screenTimeMin' then
    if jsonb_typeof(patch -> 'screenTimeMin') <> 'number'
       or (patch ->> 'screenTimeMin')::numeric not between 0 and 600 then
      raise exception 'screenTimeMin inválido' using errcode = '22023';
    end if;
    clean := clean || jsonb_build_object('screenTimeMin', round((patch ->> 'screenTimeMin')::numeric));
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
