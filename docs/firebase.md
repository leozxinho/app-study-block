# Firebase (login, banco e servidor)

Substitui o Supabase. Sem as variáveis `VITE_FIREBASE_*` o app roda em **modo local** (tudo no navegador).
Roda no **plano Spark (grátis)**: o cadastro das crianças, o zerar e os ajustes não precisam de servidor.
Só a cobrança (Stripe) usa Cloud Functions e exige o plano Blaze.

## O que fica onde

| Coisa | Onde |
| --- | --- |
| Login do responsável (e-mail/senha, Google) e da criança (login + senha) | Firebase Authentication |
| Crianças confirmadas pelo responsável (no máximo 2) | Firestore `guardians/{uid do responsável}.childIds` |
| Ficha da criança (responsável, nome, login, faixa etária) | Firestore `children/{uid da criança}` |
| Progresso da criança | Firestore `childState/{uid}`: `state` (JSON), `settings`, `revision` |
| Assinatura (quando ativar) | Firestore `subscriptions/{uid do responsável}` (só o webhook grava) |
| Stripe | Cloud Functions em `functions/src/index.ts` (Blaze) |
| Regras de acesso | `firestore.rules` |

Conta de criança = e-mail `<login>@crianca.minelearn.app` (nenhum e-mail é enviado). O responsável cria
a conta numa instância descartável do Firebase (não perde a própria sessão); a conta da criança grava a
ficha apontando o responsável, e o responsável confirma em `guardians`. As regras só aceitam o vínculo
com os dois lados, então ninguém vira "criança" de outro responsável sem ele confirmar.
Cada criança lembrada no aparelho tem a própria instância (`child:<login>`) e entra de novo sem senha.

## Passo a passo (Spark)

1. Firestore criado em `southamerica-east1`, modo de produção.
2. **Authentication > Sign-in method**: ative *E-mail/senha* e *Google*. Em *Settings > Authorized domains*, adicione o domínio do site.
3. `.env` com a configuração do app web (veja `.env.example`).
4. Publique as regras: `firebase deploy --only firestore`

## Quando for cobrar (Blaze + Stripe)

```sh
cp functions/.env.example functions/.env   # APP_ORIGIN e preços do Stripe
(cd functions && npm install)
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase deploy --only functions
```

No Stripe (Developers > Webhooks), aponte para a URL da função `stripeWebhook` com os eventos
`customer.subscription.created/updated/deleted`, e mude `VITE_REQUIRE_SUBSCRIPTION=true`.

## Mudar o domínio das crianças

`VITE_CHILD_EMAIL_DOMAIN` (app), `CHILD_EMAIL_DOMAIN` (functions/.env) e as duas linhas marcadas em `firestore.rules`.

## Verificação em duas etapas (responsável, opcional)

App autenticador (TOTP). O responsável liga em **Área dos Pais > Verificação em duas etapas**; depois,
o login pede o código de 6 números. Precisa de e-mail confirmado. Crianças não usam.

Ligar no projeto (uma vez):
1. **Authentication > Settings > Fazer upgrade** para *Identity Platform* (grátis até um limite de usuários ativos por dia).
2. Console > Configurações do projeto > Contas de serviço > **Gerar nova chave privada**.
3. `GOOGLE_APPLICATION_CREDENTIALS=/caminho/chave.json node functions/scripts/enable-totp.mjs`
4. Apague o arquivo da chave e exclua a chave no console (ela dá acesso total ao projeto).
