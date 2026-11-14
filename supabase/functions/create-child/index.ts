// Edge Function: o responsável logado cria a conta (login e senha) de uma criança.
// Deploy: supabase functions deploy create-child
// Usa a service role só aqui no servidor; o app nunca vê essa chave.
import { createClient } from 'npm:@supabase/supabase-js@2';

const AGE_GROUPS = ['bercario', 'maternal', 'pre-escola-1', 'pre-escola-2', 'fundamental-1', 'fundamental-2'];
const USERNAME = /^[a-z0-9._-]{3,20}$/;
const MAX_CHILDREN = 2; // igual a PRODUCT.maxChildren (src/config/product.ts)
// Mesmo domínio que o app usa no login da criança (VITE_CHILD_EMAIL_DOMAIN). Nenhum e-mail é enviado.
const CHILD_EMAIL_DOMAIN = Deno.env.get('CHILD_EMAIL_DOMAIN') ?? 'crianca.minelearn.app';

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'método não permitido' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authorization = req.headers.get('Authorization') ?? '';
  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return reply(401, { error: 'entre na sua conta de responsável' });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Conta de criança não cria outras crianças (confere na tabela, não no metadata editável)
  const { data: isChild } = await admin.from('children').select('id').eq('id', user.id).maybeSingle();
  if (isChild || user.app_metadata?.role === 'student') return reply(403, { error: 'só o responsável pode criar contas' });

  let body: { name?: unknown; username?: unknown; password?: unknown; age_group?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'dados inválidos' });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const ageGroup = typeof body.age_group === 'string' ? body.age_group : '';
  if (name.length < 1 || name.length > 40) return reply(400, { error: 'nome precisa ter de 1 a 40 letras' });
  if (!USERNAME.test(username)) return reply(400, { error: 'login: 3 a 20 letras minúsculas, números, ponto, traço ou _' });
  if (password.length < 6 || password.length > 72) return reply(400, { error: 'senha precisa ter de 6 a 72 caracteres' });
  if (!AGE_GROUPS.includes(ageGroup)) return reply(400, { error: 'faixa etária inválida' });

  const { count } = await admin.from('children').select('id', { count: 'exact', head: true }).eq('guardian_id', user.id);
  if ((count ?? 0) >= MAX_CHILDREN) return reply(409, { error: `limite de ${MAX_CHILDREN} crianças por responsável` });

  const { data: taken } = await admin.from('children').select('id').eq('username', username).maybeSingle();
  if (taken) return reply(409, { error: 'esse login já existe, escolha outro' });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: `${username}@${CHILD_EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { name, username, age_group: ageGroup },
    app_metadata: { role: 'student', guardian_id: user.id },
  });
  if (createError || !created.user) {
    const duplicate = /already|exists|registered/i.test(createError?.message ?? '');
    return reply(duplicate ? 409 : 500, { error: duplicate ? 'esse login já existe, escolha outro' : 'não foi possível criar a conta' });
  }

  const childId = created.user.id;
  const { error: linkError } = await admin
    .from('children')
    .insert({ id: childId, guardian_id: user.id, name, username, age_group: ageGroup });
  const { error: stateError } = linkError
    ? { error: linkError }
    : await admin.from('child_state').insert({ child_id: childId });
  if (linkError || stateError) {
    await admin.auth.admin.deleteUser(childId); // desfaz para não sobrar conta solta
    return reply(500, { error: 'não foi possível criar a conta' });
  }

  return reply(201, { id: childId, name, username, age_group: ageGroup });
});
