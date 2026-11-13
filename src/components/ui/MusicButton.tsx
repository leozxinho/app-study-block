import { Music, Music2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { hasAnyMusic, setMusicEnabled, useMusicEnabled } from '../../lib/audio/music';
import { audioIndexVersion, subscribeAudioIndex } from '../../lib/audio/library';

/** Liga/desliga só a música (aparece quando há músicas gravadas). */
export function MusicButton({ className = '' }: { className?: string }) {
  const on = useMusicEnabled();
  useSyncExternalStore(subscribeAudioIndex, audioIndexVersion, audioIndexVersion);
  if (!hasAnyMusic()) return null;
  const label = on ? 'Desligar a música' : 'Ligar a música';
  return (
    <button
      type="button"
      onClick={() => setMusicEnabled(!on)}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`relative w-11 h-11 flex items-center justify-center rounded-md bg-black/25 text-white hover:bg-black/40
        focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-gold ${className}`}
    >
      {on ? <Music size={22} aria-hidden="true" /> : <Music2 size={22} aria-hidden="true" className="opacity-50" />}
    </button>
  );
}
