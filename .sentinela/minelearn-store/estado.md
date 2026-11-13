# Estado: minelearn-store + contas de família

- Etapas 1 e 2 do plano: implementadas em 2026-11-13. O usuário pediu "Pode aplicar essas correções no código" e delega as decisões.
- Decisões tomadas sem o gate do pipeline:
  - Testes com `node:test` via tsx (a instalação do Vitest foi negada).
  - O modo local continua como demonstração/offline.
  - O responsável joga como visitante (doc `guest`); só a conta de criança grava no servidor.

## Feito
- **Store único** em `src/lib/store/`:
  - `progressStore.ts` (núcleo puro), `adapters.ts` (local e Supabase com revisão otimista), `legacy.ts` (migração das chaves antigas) e `index.ts`.
  - Os serviços progress, adventure e gameStats leem e gravam pelo store. As leituras continuam síncronas e o Supabase carrega no login (`ProgressGate`).
- **Contas:**
  - O responsável usa e-mail ou Google; a criança usa login e senha (aba "Sou criança").
  - `authService.start()` troca o progresso da conta ativa.
- **Área dos Pais** em `/responsavel` (`/teacher` redireciona), que substitui o TeacherDashboard:
  - Saíram os MOCK_STUDENTS e a criação de atividades.
  - Permite cadastrar criança, ver o resumo, "liberar todos os mundos" e zerar várias crianças digitando ZERAR.
- **Supabase** (versionado, não aplicado):
  - `supabase/migrations/20261113120000_familia_e_progresso.sql`: children, child_state, RLS, `reset_children` e `set_child_unlock_all`.
  - `supabase/functions/create-child`.

## Validação
- Type-check (`tsc`), lint (`eslint`) e build passaram. O bundle caiu de 1.373 kB para 981 kB.
- Testes: 20/20, incluindo a mutação conferida para a proteção de carga e para o conflito.
- `auditActivities` deu 717/717.
- E2E Playwright do fluxo de família em modo demo: 12 passos OK.
- Não validado (exige banco): RLS, RPCs, Edge Function e login real da criança no Supabase.

## Pendente
- **QR (Opção 1):** exige Supabase conectado, uma Edge Function de pareamento e uma lib de QR (instalação precisa de autorização).
- **Etapa 3 do plano:** recursos de Duolingo.
- **Dependência `recharts`:** sem uso, remover com `npm uninstall recharts`.
