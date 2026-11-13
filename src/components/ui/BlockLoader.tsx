/** Carregando: um bloco de grama pulando e girando. */
export function BlockLoader({ label = 'Carregando…', dark = false }: { label?: string; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status">
      <div className="block-loader" aria-hidden="true">
        <span className="grass-block pixel-border block w-12 h-12" />
      </div>
      <p className={`font-minecraft text-xs ${dark ? 'text-white' : 'text-gray-800'}`}>{label}</p>
    </div>
  );
}
