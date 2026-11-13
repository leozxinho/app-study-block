import { MessageCircle, MessageCircleOff } from 'lucide-react';
import { isVoiceSupported, setVoiceEnabled, speak, useVoiceEnabled } from '../../lib/voice';

/** Liga/desliga a voz que lê as perguntas e as falas do mascote. */
export function VoiceButton({ className = '' }: { className?: string }) {
  const on = useVoiceEnabled();
  if (!isVoiceSupported()) return null;
  const label = on ? 'Desligar a voz' : 'Ligar a voz';
  return (
    <button
      type="button"
      onClick={() => {
        setVoiceEnabled(!on);
        if (!on) speak('Voz ligada!', { force: true });
      }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`w-11 h-11 flex items-center justify-center rounded-md bg-black/25 text-white hover:bg-black/40
        focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-gold ${className}`}
    >
      {on ? <MessageCircle size={22} aria-hidden="true" /> : <MessageCircleOff size={22} aria-hidden="true" />}
    </button>
  );
}
