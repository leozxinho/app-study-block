/** Posições das bolinhas de 1 a 6 numa grade 3x3 (como num dado). */
const DICE: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/**
 * Bolinhas embaixo do número, para quem ainda não reconhece o número escrito.
 * 1 a 6: desenho de dado; 7 a 10: duas fileiras (5 + o resto). Acima de 10 não mostra.
 */
export function NumberDots({ n, className = '' }: { n: number; className?: string }) {
  if (n < 1 || n > 10) return null;
  const dot = 'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current';
  if (n <= 6) {
    return (
      <span aria-hidden="true" className={`grid grid-cols-3 gap-0.5 ${className}`}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={DICE[n].includes(i) ? dot : 'w-1.5 h-1.5 sm:w-2 sm:h-2'} />
        ))}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={`flex flex-col gap-0.5 items-center ${className}`}>
      {[5, n - 5].map((count, row) => (
        <span key={row} className="flex gap-0.5">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={dot} />
          ))}
        </span>
      ))}
    </span>
  );
}
