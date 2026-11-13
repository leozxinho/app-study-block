interface ActivityProgressProps {
  current: number;
  total: number;
  /** Ex.: "Pergunta" ou "Fase" */
  label?: string;
}

/** Barra "Pergunta 3 de 8". */
export function ActivityProgress({ current, total, label = 'Pergunta' }: ActivityProgressProps) {
  if (total < 1) return null;
  const pct = Math.min(100, Math.round((current / total) * 100));
  const text = `${label} ${current} de ${total}`;
  return (
    <div className="mb-4">
      <p className="font-body font-bold text-sm text-gray-800 mb-1 text-center">{text}</p>
      <div
        role="progressbar"
        aria-label={text}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        className="w-full h-4 bg-gray-300 rounded-sm pixel-border overflow-hidden"
      >
        <div
          className="h-full bg-minecraft-emerald transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
