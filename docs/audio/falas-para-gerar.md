# Falas para gerar de novo (troca de nomes, nov/2026)

Os nomes que lembravam o Minecraft foram trocados no jogo (Nether → Reino de Fogo, End → Reino das
Estrelas, Creeper → Estourinho, Enderman → Sombrio, Steve → Téo, Alex → Lia, Villager → Morador,
Ghast → Fantasminha, Blaze → Fogaréu). Até as falas abaixo serem geradas, o jogo toca uma frase
gravada parecida nesses textos (ex.: "Encontre os pares iguais!", "Quantos objetos?") ou a gravação antiga,
nos arquivos fixos. A voz do aparelho não é mais usada.

1. **Perguntas novas:** `falas-perguntas.csv`, linhas `q-0674` a `q-0702` (acrescentadas no fim; as antigas
   não mudaram de nome).
2. **Rodadas:** `falas-rodadas.csv` já está atualizado (os arquivos `r-<código>` novos são os textos novos).
3. **Arquivos fixos que falam os nomes antigos** (texto já atualizado em `falas-voz-suave.csv`):
   - `voz/chefes/07/*`, `voz/chefes/09/*`, `voz/chefes/10/*` (Estourinho de Fogo, Sombrio Gigante, Rei Estourinho);
   - `voz/mundos/mundo-07.mp3` e `voz/mundos/mundo-09.mp3` (Reino de Fogo e Reino das Estrelas).

Depois de gerar, rode `npm run audio` e `npm run check:activities` (a linha "frase parecida" deve voltar a 0%).

4. **Nome do app:** `voz/pais/boas-vindas.mp3` ("Bem-vindo ao StudyBlock!", texto já trocado em `falas-voz-suave.csv`).

5. **Conquistas novas (50):** `voz/conquistas/<id>.mp3` ("Conquista: <nome>!"), linhas acrescentadas no fim de `falas-voz-suave.csv`. Sem o arquivo, o modal só não fala a conquista.
