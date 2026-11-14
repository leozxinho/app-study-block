# Falas para gerar de novo (troca de nomes, nov/2026)

Os nomes que lembravam o Minecraft foram trocados no jogo (Nether → Reino de Fogo, End → Reino das
Estrelas, Creeper → Estourinho, Enderman → Sombrio, Steve → Téo, Alex → Lia, Villager → Morador,
Ghast → Fantasminha, Blaze → Fogaréu). Até as falas abaixo serem geradas, o jogo usa a voz do aparelho
nesses textos (ou toca a gravação antiga, nos arquivos fixos).

1. **Perguntas novas:** `falas-perguntas.csv`, linhas `q-0674` a `q-0702` (acrescentadas no fim; as antigas
   não mudaram de nome).
2. **Rodadas:** `falas-rodadas.csv` já está atualizado (os arquivos `r-<código>` novos são os textos novos).
3. **Arquivos fixos que falam os nomes antigos** (texto já atualizado em `falas-voz-suave.csv`):
   - `voz/chefes/07/*`, `voz/chefes/09/*`, `voz/chefes/10/*` (Estourinho de Fogo, Sombrio Gigante, Rei Estourinho);
   - `voz/mundos/mundo-07.mp3` e `voz/mundos/mundo-09.mp3` (Reino de Fogo e Reino das Estrelas).

Depois de gerar, rode `npm run audio` e `npm run check:activities` (a linha "voz do aparelho" deve voltar a 0%).
