import { Volume2, VolumeX } from 'lucide-react';
import { playSound, useMuted } from '../../lib/sounds';

/** Liga/desliga os sons (fica salvo no navegador). */
export function MuteButton({ className = '' }: { className?: string }) {
  const [muted, setMuted] = useMuted();

  const toggle = () => {
    setMuted(!muted);
    if (muted) playSound('click');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Ligar os sons' : 'Desligar os sons'}
      title={muted ? 'Ligar os sons' : 'Desligar os sons'}
      className={`w-11 h-11 flex items-center justify-center rounded-md bg-black/25 text-white hover:bg-black/40
        focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-gold ${className}`}
    >
      {muted ? <VolumeX size={22} aria-hidden="true" /> : <Volume2 size={22} aria-hidden="true" />}
    </button>
  );
}
