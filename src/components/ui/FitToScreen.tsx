import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface FitToScreenProps {
  children: ReactNode;
  /** Elemento fixo no topo (a barra da fase): a área livre começa embaixo dele. */
  topSelector?: string;
  /** Espaço livre a deixar embaixo (px). */
  bottomGap?: number;
  /** Menor escala aceita: abaixo disso a tela rola (botões e textos não ficam pequenos demais). */
  min?: number;
}

/**
 * Ajuste automático ao tamanho da tela: mede a altura do conteúdo e, se não couber na área livre
 * (celular deitado, celular pequeno, tablet...), encolhe tudo por igual até caber. Refaz a conta
 * quando a tela gira ou muda de tamanho e quando o conteúdo muda (nova pergunta, dica...).
 * Usa transform e mantém a largura (o conteúdo não se rearruma ao encolher, então a conta não fica oscilando).
 */
export function FitToScreen({ children, topSelector, bottomGap = 16, min = 0.8 }: FitToScreenProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Medida de layout (offset), não a da tela: a barra entra deslizando e a posição animada enganaria a conta
        const bar = topSelector ? document.querySelector<HTMLElement>(topSelector) : null;
        const top = bar ? bar.offsetTop + bar.offsetHeight : 0;
        const available = window.innerHeight - top - bottomGap * 2;
        const natural = inner.offsetHeight; // altura sem a escala (transform não altera)
        if (!natural || available <= 0) return;
        // Telas muito pequenas (320 px de largura ou de altura): aceita encolher um pouco mais
        const floor = window.innerWidth < 360 || window.innerHeight < 360 ? Math.min(min, 0.7) : min;
        const next = Math.max(floor, Math.min(1, available / natural));
        // Encolher: sempre (senão sobra rolagem). Crescer: só com diferença visível (evita ajustar de 1 em 1 pixel)
        setScale((s) => (next < s || next - s > 0.015 ? next : s));
        setHeight(natural);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [topSelector, bottomGap, min]);

  const scaled = scale < 1;
  return (
    <div style={scaled && height ? { height: height * scale } : undefined}>
      <div
        ref={innerRef}
        style={
          scaled
            ? { transform: `scale(${scale})`, transformOrigin: 'top center' }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
