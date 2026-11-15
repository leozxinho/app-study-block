# StudyBlock

Jogo educativo para crianças estudarem em casa, acompanhado pelos pais. Estilo Duolingo, com mundos,
fases, XP, troféus, ofensiva, meta do dia e chefes. O responsável cria a conta de cada criança
(até 2) e acompanha o progresso na Área dos Pais.

## Tecnologias

- React 18 + TypeScript + Vite, Tailwind CSS, Framer Motion
- Firebase: Authentication (e-mail/senha, Google, 2FA por app autenticador) e Firestore
- Cloud Functions só para cobrança (Stripe), quando ativada
- Site publicado no GitHub Pages (`.github/workflows/pages.yml`)

## Rodar no computador

Requisitos: Node 22.

```sh
npm install
cp .env.example .env   # preencha com a configuração do app web do Firebase
npm run dev            # http://localhost:5173
```

Sem as variáveis `VITE_FIREBASE_*`, o app roda em **modo local**: contas e progresso ficam só no navegador.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | manifesto de áudio, checagem de tipos, build e pré-render das páginas públicas |
| `npm run lint` | ESLint |
| `npm run check:activities` | confere as atividades do jogo |
| `npm run audio` | refaz `public/audio/manifest.json` |
| `npm run vozes:*` | gera as falas com ElevenLabs (precisa de `ELEVENLABS_API_KEY` no `.env.local`) |

## Pastas

| Pasta | Conteúdo |
| --- | --- |
| `src/` | app (páginas, componentes, serviços, dados das atividades) |
| `public/` | arquivos servidos como estão (áudios, ícones) |
| `firebase/` | regras e índices do Firestore |
| `functions/` | Cloud Functions (Stripe) |
| `scripts/` | build, auditoria das atividades e geração de vozes |
| `docs/` | guias e auditorias |

## Publicar (GitHub Pages)

Cada push na `main` gera o site e publica em `https://leozxinho.github.io/app-study-block/`
(workflow `.github/workflows/pages.yml`). A configuração do Firebase do build vem de `.env.production`.

- O site fica na pasta `/app-study-block/`: o build usa `VITE_BASE_PATH` (ver `src/lib/base.ts`).
- Rotas do app (`/inicio`, `/responsavel`...) abrem pelo `404.html`, que é o próprio app.
- Domínio próprio: em *Settings > Secrets and variables > Actions > Variables*, crie `VITE_BASE_PATH=/`
  e `VITE_SITE_URL=https://seu-dominio`, e configure o domínio em *Settings > Pages*.

## Firebase

Configuração, regras de acesso, 2FA e cobrança: [docs/firebase.md](docs/firebase.md).

```sh
firebase deploy --only firestore   # publica firebase/firestore.rules
```
