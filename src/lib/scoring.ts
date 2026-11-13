/**
 * Estrelas no fim da atividade conforme os erros (atividade com 5+ tarefas):
 * 0 erro = 3 estrelas, 1 ou 2 erros = 2, 3 ou mais = 1.
 */
export function starsForErrors(errors: number): number {
  if (errors <= 0) return 3;
  if (errors <= 2) return 2;
  return 1;
}

/**
 * Pontuação (0-100) usada no progresso da aventura.
 * Bate com calculateStars do adventureService: 100 = 3, 70 = 2, >0 = 1 estrela.
 */
export function scoreForErrors(errors: number): number {
  if (errors <= 0) return 100;
  if (errors <= 2) return 70;
  return 40;
}
