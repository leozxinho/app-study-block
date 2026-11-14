/** Chão de grama e terra no pé da tela (o mesmo na landing e no login). */
export function GroundStrip({ dirt = 'h-6' }: { /** Altura da terra (classe Tailwind) */ dirt?: string }) {
  return (
    <div className="absolute inset-x-0 bottom-0" aria-hidden="true">
      <div className="h-3 bg-brand-green border-b-2 border-brand-dark-green" />
      <div className={`${dirt} bg-brand-dirt block-pattern`} />
    </div>
  );
}
