# Correções da auditoria de 14/11/2026

Branch `fix/auditoria-2026-11`, com um commit por fase e sem push. A auditoria original está em
`docs/auditoria-minelearn-2026-11-14.md`.

## Commits

| Commit | Fase |
|---|---|
| `3a686e5` | Assinatura com Stripe. Já estava pronta e sem commit no `main`; ficou separada para não se misturar às fases. |
| `47f7c5e` | Fase 1: correções rápidas e o script `check:activities` |
| `9d217f2`, `3308c66` | Fase 2: vozes das contas e da contagem |
| `ed20c27` | Fase 3: SEO da página pública |
| `f32c9e7` | Fase 6: carregamento sob demanda (feita antes das Fases 4 e 5, que esperavam aprovação) |
| `8a3466e` | Fase 4 (a): marca no marketing |
| `deb6a99` | Fase 5: redundância e código sem uso |

## Situação de cada item

| # | Item | Situação | O que foi feito |
|---|---|---|---|
| 1 | SEO | **Feito** | Ver os detalhes abaixo. |
| 2 | Marca Minecraft | **Feito em parte** | A parte de marketing está feita. O conteúdo do jogo depende de decisão (ver "Pendências"). |
| 3 | Vozes de números e contas | **Feito** | Ver os detalhes abaixo. |
| 4 | Dois players | **Feito** | Ver os detalhes abaixo. |
| 5 | Tudo carrega de uma vez | **Feito** | A auditoria estava em parte errada. Ver os detalhes abaixo. |
| 6 | Código sem uso | **Feito** | A auditoria estava em parte errada. Ver os detalhes abaixo. |
| 7 | Tentativas infladas | **Feito** | Ver os detalhes abaixo. |
| 8 | Opções da contagem longe da faixa | **Feito** | Ver os detalhes abaixo. |
| 9 | Rodadas repetidas | **Feito** | Ver os detalhes abaixo. |
| 10 | Textos | **Feito** | Ver os detalhes abaixo. |
| 11 | Trava com toques rápidos | **Feito** (por prevenção) | Não reproduzi o problema pelo código. Ver os detalhes abaixo. |
| 12 | Efeitos e músicas | **Adiado** | Depende das gravações (lotes do roteiro). Não houve mudança de código. |

### Detalhes

**Item 1, SEO**
- A landing passou de `/conheca` para `/`. `/conheca` virou um redirect 301 (`vercel.json` e `public/_redirects`).
- Quem já está logado vai para `/inicio`. Um script curto no `index.html` faz isso antes de mostrar a página.
- O build pré-renderiza a landing em HTML estático:
  - `src/prerender.tsx` é compilado com `vite build --ssr` e processado por `scripts/prerender.mjs`, que usa `renderToString`;
  - o `dist/index.html` sai com o H1, os textos, o FAQ, o canonical, as metas og:* e twitter:card e o JSON-LD (WebSite e FAQPage);
  - as outras rotas recebem `dist/app.html`, um shell com `noindex`.
- Título e descrição por rota estão em `src/components/ui/RouteMeta.tsx`. Só `/` é indexada.
- O sitemap e o `robots.txt` (com a linha `Sitemap:`) são gerados no build a partir de `VITE_SITE_URL`.
- Os CTAs agora são links `<a href>`: o `MinecraftButton` ganhou a prop `href`.
- Fiz uma imagem `og-image.png` nova, com arte original.

**Item 2, marca**
- A meta description não cita mais o Minecraft.
- A landing mostra blocos com letras no lugar dos personagens.
- Os ícones do app e o og-image são arte nova: um bloco azul com "M" e um chão liso.

**Item 3, vozes**
- A auditoria estava em parte errada. Os `sao-NN` já tocavam. Medindo o texto que cada cartão realmente fala, 100% das perguntas da aventura já tinham voz gravada. Os "12%" eram contas do math-mobs, que nunca eram lidas: o cartão falava sempre "Quanto dá a conta?".
- O que mudou:
  - `speak()` monta "Quanto é A op B?" e "A op B = ?" com as peças gravadas, e só quando todas as peças existem;
  - o math-mobs passou a ler a conta, sem a unidade;
  - a contagem é falada (`contando-NN`) quando há até 5 itens, com 750 ms por número.
- Medição (rodadas da aventura): a voz do aparelho ficou em 0% antes e depois. Hoje são 96,6% de frases gravadas inteiras e 3,4% montadas com peças.

**Item 4, dois players**
- O `switch` por tipo de atividade ficou em um lugar só: `src/components/activities/ActivityRenderer.tsx`.
- Criei o modo treino no player da aventura, em `/treino/:activityId`. Ele registra acertos e erros e soma XP, mas não mexe nas fases nem nas estrelas.
- Apaguei o modo antigo: `/world`, `/activities`, `/activity/:id`, `WorldMapPage`, `ActivityListPage`, `ActivityPlayerPage`, `mockActivities` e `categoryScenes`.
- Os links foram ajustados:
  - o painel aponta para `/adventure`;
  - saiu o botão "Ver atividades por tema" da Área dos Pais;
  - o Treino aponta para `/treino/:id`.

**Item 5, carregamento**
- A auditoria estava em parte errada: todas as rotas e os dados das atividades já eram carregados sob demanda.
- A landing agora é só HTML + CSS, com **0 kB de JS**. Antes, cada visita baixava 617 kB.
- O service worker usa `app.html` como fallback offline.

**Item 6, código sem uso**
- Apaguei `HomePage`, `IntroSplash`, `AuthModal`, a rota `/teacher`, `MobsPage` com a rota `/mobs`, e `react.svg`.
- Do `activityService` saíram as funções que não tinham uso.
- Ficaram, com motivo:
  - `Mob3D`, porque a loja usa o `Viewer360`;
  - relógio e leitura, que foram mantidos fora do jogo por decisão sua.

**Item 7, tentativas**
- A tentativa é contada 1 vez por abertura de fase (ref de guarda).
- Valores acima de 999 voltam a 0 ao ler o progresso salvo.
- Corrigi também a soma dupla ao rejogar uma fase já concluída.

**Item 8, contagem**
- Quando a pergunta tem faixa, as opções vão no máximo até o maior número da faixa +2 no berçário e +3 no maternal. A mudança está no parser.

**Item 9, rodadas repetidas**
- Não dava para reduzir a 1 rodada: essas fases têm só 3 ou 4 peças, e o mínimo é 5 tarefas.
- Nas de arrastar por tamanho, a 2ª rodada virou "entregar" (1 peça).
- Nas de ordenar por tamanho, a 2ª rodada troca minerais por cavaleiros.
- As frases usadas já tinham voz gravada.

**Item 10, textos**
- No math-mobs, aparece agora "A resposta certa está brilhando: X!".
- O balão "Quanto dá a conta?" continua igual, mas a voz agora lê a conta.

**Item 11, toques rápidos**
- A pergunta que está saindo fica com `pointer-events: none`.
- `handleCorrect` não avança duas vezes na mesma pergunta.

## Arquivos

**Alterados**
- `index.html`, `package.json`, `vercel.json`, `public/_redirects`, `public/robots.txt`, `public/sw.js`, `.env.example`
- `src/App.tsx`
- `src/pages/AdventureLevelPage.tsx`, `LandingPage.tsx`, `StudentDashboardPage.tsx`, `TrainingPage.tsx`, `ParentAreaPage.tsx`
- `src/components/activities/CountingActivity.tsx`, `MathMobsActivity.tsx`, `shared/ActivityUI.tsx`, `shared/mathSceneTiming.ts`
- `src/components/ui/MinecraftButton.tsx`, `ScreenTimeGuard.tsx`, `SubscriptionGuard.tsx`
- `src/lib/voice.ts`, `src/lib/activityParsers/counting.ts`, `src/lib/activityParsers/rounds.ts`
- `src/services/adventureService.ts`, `src/services/activityService.ts`, `src/config/product.ts`
- `scripts/auditActivities.ts`, `scripts/exportVoiceLines.ts`, `scripts/tests/rounds.test.ts`

**Novos**
- `src/components/activities/ActivityRenderer.tsx`, `src/components/ui/RouteMeta.tsx`, `src/prerender.tsx`
- `scripts/check-activities.ts`, `scripts/prerender.mjs`, `scripts/og-image.py`, `scripts/app-icons.py`
- `public/og-image.png`, `public/icons/*` (refeitos)

**Apagados**
- `src/pages/WorldMapPage.tsx`, `ActivityListPage.tsx`, `ActivityPlayerPage.tsx`, `HomePage.tsx`, `MobsPage.tsx`
- `src/data/mockActivities.ts`, `categoryScenes.ts`
- `src/components/intro/IntroSplash.tsx`, `src/components/auth/AuthModal.tsx`, `src/assets/react.svg`

## Tamanho do pacote (build de produção, JS)

| | Antes | Depois |
|---|---|---|
| JS baixado ao abrir a landing `/` | 617,5 kB (gzip 188,5) | **0 kB** |
| Chunk principal do app (`index`) | 617,5 kB (gzip 188,5) | 591,2 kB (gzip 180,8) |
| Dados das atividades (sob demanda) | 164,4 kB | 164,4 kB |
| Player da aventura com as atividades | 29,6 kB + 118,2 kB | 149,6 kB (um chunk só) |
| Total de JS | 1.090 kB | cerca de 1.070 kB |

## Verificação

Todos estes passam:
- `npm run lint`;
- `npx tsc --noEmit -p tsconfig.app.json` (o `npx tsc --noEmit` da raiz não checa nada);
- `npm run build`;
- `npm run check:activities`: 600 fases × 3 níveis × 3 montagens, sem problemas;
- `npx tsx scripts/auditActivities.ts`: 680 atividades, sem problemas;
- os 35 testes em `scripts/tests`.

## Pendências e decisões

1. **Marca no conteúdo do jogo (Fase 4 b):** precisa da decisão de vocês com um advogado.
   - Nomes propostos: Nether → Reino de Fogo, End → Reino das Estrelas, Creeper → Bombinha, Enderman → Sombrio, Steve → Téo, Alex → Lia, Villager → Morador, Ghast → Fantasminha.
   - Trocar os nomes exige regravar 27 falas e as apresentações dos chefes 7, 9 e 10 e dos mundos 7 e 9.
   - Os desenhos dos mobs (`mobSprites.ts`) também lembram o jogo.
   - O que é só código (`MinecraftButton`, `font-minecraft`, as chaves `minecraft_edu_*`) não aparece para o usuário. As chaves não devem ser renomeadas, porque isso apagaria o progresso salvo.
2. **`VITE_SITE_URL`:** a variável foi criada no `.env.example` com `https://minelearn.app`, que é um palpite a partir do domínio das contas de criança. Configure o domínio real na Vercel. Sem ela, o build avisa e usa esse valor.
3. **`tsx`:** o `check:activities` roda com `npx tsx`, que não está no `package.json`. Vale adicioná-lo como devDependency.
4. **Órfãos que surgiram ao apagar o player antigo** (não apaguei sem pedir): `src/components/ui/ActivityProgress.tsx` e `src/components/ui/RewardAnimation.tsx`.
5. **Relógio e leitura:** dados, parsers e componentes foram mantidos, mas não estão em nenhuma fase.
6. **Chunk principal (591 kB):** quase todo é Supabase, router e framer-motion, que o app inteiro usa. Tirar o Supabase do carregamento inicial exigiria refatorar a autenticação.
7. **Hidratação:** a landing pré-renderizada não é hidratada, porque não carrega JS. Os links levam a `/login`, onde o app carrega.
8. **Treino com atividades do modo antigo:** um treino antigo que aponte para uma atividade que não existe mais mostra "Atividade não disponível" e o botão "Voltar ao treino".
