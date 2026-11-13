import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Largura máxima (classe Tailwind) */
  maxWidth?: string;
}

/** Janela sobre a tela: fecha com Esc, no X ou clicando fora; prende o foco dentro. */
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  // Ref: a função muda a cada render do pai, mas os eventos só devem ser ligados ao abrir
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && boxRef.current) {
        const items = boxRef.current.querySelectorAll<HTMLElement>('button, a[href], input, select, iframe, video, [tabindex]:not([tabindex="-1"])');
        const list = Array.from(items).filter((el) => !el.hasAttribute('disabled'));
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => boxRef.current?.querySelector<HTMLElement>('input, button:not([aria-label="Fechar"])')?.focus(), 50);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open]);

  // Portal no <body>: fica acima de tudo (mobs andando, cabeçalho...), fora das camadas da página
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            ref={boxRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto bg-white rounded-lg pixel-border shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-lapis z-10"
            >
              <X size={20} />
            </button>
            <h2 id={titleId} className="sr-only">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
