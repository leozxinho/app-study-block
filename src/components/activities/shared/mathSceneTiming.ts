// Tempos da animação da soma (usados pela cena e por quem espera ela terminar).

/** Tempo (ms, antes do fator) para os grupos se juntarem antes de começar a contar. */
export const ADD_MERGE_MS = 600;
/** Tempo (ms) entre um item contado e o próximo. */
export const ADD_COUNT_MS = 280;

/** Quanto tempo a comemoração da soma leva (juntar + contar + ver o total), para esperar antes de seguir. */
export function addCelebrationMs(total: number): number {
  return ADD_MERGE_MS + total * ADD_COUNT_MS + 1300;
}

/** Subtração: tempo da fumaça dos que saem antes de contar os que sobram. */
export const SUB_SMOKE_MS = 900;

/** Quanto tempo a comemoração da subtração leva (fumaça + contar os que sobram + ver o resultado). */
export function subCelebrationMs(remaining: number): number {
  return SUB_SMOKE_MS + 200 + remaining * ADD_COUNT_MS + 1300;
}

/** Multiplicação: tempo entre um item contado e o próximo (mais rápido, pode ter até 20). */
export const MULT_COUNT_MS = 200;
/** Divisão: tempo entre um item entrar num cercado e o próximo. */
export const DIV_MOVE_MS = 260;

export function multCelebrationMs(total: number): number {
  return total * MULT_COUNT_MS + 1300;
}

export function divCelebrationMs(items: number): number {
  return items * DIV_MOVE_MS + 1500;
}

/** Tempo da comemoração de qualquer conta (para esperar antes da próxima pergunta). */
export function celebrationMs(problem: { a: number; b: number; op: string; answer: number }): number {
  switch (problem.op) {
    case '+':
      return addCelebrationMs(problem.a + problem.b);
    case '-':
      return subCelebrationMs(problem.answer);
    case '×':
      return multCelebrationMs(problem.a * problem.b);
    default:
      return divCelebrationMs(problem.a);
  }
}
