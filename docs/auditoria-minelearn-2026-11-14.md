# Auditoria MineLearn — 14/11/2026

Feita no ambiente local (`http://localhost:5173`), lendo o código que o Vite
serve e jogando no navegador. Os dados locais foram restaurados depois dos testes.

## O que está funcionando (verificado)

- **Atividades:** 622 atividades, 6 faixas × 100 fases. Todas as 600 fases montam
  pelo menos 5 tarefas.
- **Respostas:** 32.736 rodadas checadas nos 3 níveis adaptativos (mais fácil,
  normal, mais difícil), com estes resultados:
  - nenhuma resposta certa fora das opções;
  - nenhuma opção repetida;
  - nenhuma conta com resultado errado;
  - nenhum texto que o parser não reconheça.
- **Fluxo da fase 3 (fundamental 2):** joguei a fase inteira, com estes resultados:
  - acerto → "Muito bem! Próxima!";
  - 1º erro → dica;
  - 2º erro → resposta brilha;
  - minijogo no meio da fase;
  - modal final com 3 estrelas, +10 XP, figurinha nova e "Próxima fase";
  - toast de conquista ("3 Dias Seguidos").
- **Áudio:**
  - o manifest tem 1.748 arquivos de voz;
  - todo texto aponta para um arquivo que existe;
  - a amostra de arquivos carrega como MP3;
  - nenhum WAV nem pasta `_teste` foi parar no site.

## Problemas, por prioridade

### Alta

1. **SEO: a página pública não é lida pelo Google.**
   - O HTML entregue é só `<div id="root"></div>`: todo o texto da landing
     aparece via JavaScript.
   - O `<title>` é "MineLearn" em todas as rotas.
   - Faltam `canonical` e `og:image`.
   - Não existe `sitemap.xml` (a URL devolve o HTML do app), e o `robots.txt`
     não aponta para um sitemap.
   - A landing está em `/conheca`, e `/` é a tela do jogo.
   - Os CTAs da landing são `<button>`: a página tem **0 links `<a>`** que o
     buscador possa seguir.
   - **Sugestão simples:**
     - pré-renderizar só a landing em HTML estático;
     - servir a landing em `/` para quem não está logado;
     - um título e uma descrição por rota, num objeto simples (sem biblioteca);
     - `sitemap.xml` estático com 2 ou 3 URLs públicas;
     - CTAs como `<a href>`.
2. **Uso da marca Minecraft.**
   - A meta description do `index.html` diz "tema de Minecraft".
   - A landing mostra personagens parecidos com Steve, Creeper e porco do jogo.
   - O conteúdo usa nomes do jogo (creeper, enderman, Nether, End, ghast).
   - Para um produto pago, isso é risco de marca e direito autoral. O próprio
     roteiro de áudio do projeto pede tudo 100% original. Vale revisar com um
     advogado (não sou advogado).
3. **As vozes de números e contas não são usadas.**
   - 141 arquivos em `voz/numeros/` e 10 em `voz/contas/` foram gravados, mas
     nenhum código chama esses arquivos.
   - Cerca de 12% das rodadas, principalmente contas sorteadas no
     fundamental 1 e 2 (por exemplo "Quanto é 9 + 5?"), ainda usam a voz robótica
     do aparelho.
   - Falta montar a frase com as peças, assim:
     `quanto-e + n-009 + mais + n-005`.

### Média

4. **Dois jogos paralelos (redundância).**
   - O modo antigo usa as rotas `/world`, `/activities` e `/activity/:id`, com os
     arquivos `WorldMapPage`, `ActivityListPage`, `ActivityPlayerPage` e
     `mockActivities`.
   - Ele repete o player da aventura: o `switch` por tipo de atividade, o
     registro de resultado e o cálculo de estrelas existem em
     `ActivityPlayerPage` **e** em `AdventureLevelPage`.
   - O modo antigo ainda é alcançável:
     - pelo painel (`/dashboard` → `/world`);
     - pela Área dos Pais (`/activities`);
     - pelo Treino (`/activity/`).
   - **Sugestão:** um player só (o da aventura, com um "modo treino") e apagar
     o restante.
5. **Tudo carrega de uma vez.**
   - Só `/mobs` é carregada sob demanda (lazy).
   - Os dados de atividades (6.583 linhas), a Área dos Pais (1.100 linhas) e
     todas as outras páginas vão no mesmo pacote, inclusive para quem só abre a
     landing.
   - Isso piora o tempo de carregamento e o SEO.
   - **Sugestão:** `lazy()` por rota.
6. **Código sem uso.**
   - `Mob3D.tsx` (352 linhas) é exportado e nunca usado.
   - Os parsers de "relógio" (`clock`) e "leitura" (`reading`) não têm nenhuma
     atividade.
   - As rotas `/teacher` e `/mobs` não têm link em lugar nenhum.
   - Existem três telas de entrada: `/` HomePage, `/inicio` StartPage e
     `/conheca` LandingPage. Vale decidir uma.
7. **O contador de tentativas está inflado.**
   - `startLevel` roda dentro de um `useEffect`.
   - Em desenvolvimento (StrictMode), cada abertura de fase soma +2.
   - Os dados locais mostram fases com até **32.407 tentativas**, vindas de uma
     versão anterior.
   - Se a Área dos Pais mostrar "tentativas", o número está errado.
   - **Sugestão:** contar a tentativa uma vez por abertura, com uma ref de guarda,
     e zerar os valores absurdos.

### Baixa

8. **Contagem no berçário:**
   - O texto diz "(1 ou 2)", mas as opções vão até 8.
   - Isso acontece em 100% das rodadas do berçário e em 90% das do maternal.
   - Para bebês, as opções deveriam ficar perto da faixa da pergunta.
9. **Rodadas repetidas:**
   - 7 fases de arrastar do maternal (10, 20, 40, 60, 70, 80 e 100) repetem a
     mesma tarefa nas 2 rodadas.
   - O mesmo acontece em 2 fases de ordenar do pré-escola 1 (24 e 78).
10. **Textos:**
    - Depois do 2º erro aparece "A resposta certa é 12. A resposta certa está
      brilhando!", repetindo a mesma informação.
    - O balão da mascote fica fixo em "Quanto dá a conta?" a fase toda.
11. **Possível trava com toques muito rápidos:**
    - Numa sequência de cliques automáticos, a fase parou depois de um acerto.
    - Com cliques normais não reproduzi.
    - Suspeita: durante a animação de saída (`AnimatePresence`), os botões da
      questão anterior continuam clicáveis.
    - Vale bloquear cliques enquanto a questão está saindo.
12. **Efeitos e músicas:** ainda não há arquivos `sfx/` nem `musica/` no
    manifest, então o jogo usa os bipes sintetizados. Era o esperado pelos lotes
    do roteiro.

## O que não testei

- Login real de criança e sincronização com o Supabase (`child_state`).
- Área dos Pais, loja, casinha, relâmpago, treino e a prova do chefe.
- O build de produção (`npm run build`), que é onde o tamanho do pacote importa.
