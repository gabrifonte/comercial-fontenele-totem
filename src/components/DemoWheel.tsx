import React, { useEffect, useRef } from 'react';

export type WheelPhase = 'idle' | 'spin' | 'win';

interface DemoWheelProps {
  /** Nomes dos brindes mostrados nas fatias */
  names: string[];
  /** Avisa quando a roleta começa a girar, para (informando o prêmio sorteado) e volta ao modo idle */
  onPhase?: (phase: WheelPhase, wonPrize?: string) => void;
  /** Tempo parada entre um giro e outro (ms) */
  pauseMs?: number;
}

/**
 * Roleta de demonstração (somente visual) para o modo descanso: gira sozinha,
 * desacelera, para por um instante e gira de novo. Segue o layout da roleta oficial:
 * aro vermelho, fatias vermelhas/brancas e letras vermelhas nas fatias brancas.
 */
export const DemoWheel: React.FC<DemoWheelProps> = ({ names, onPhase, pauseMs = 9000 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onPhaseRef = useRef(onPhase);
  onPhaseRef.current = onPhase;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const list = names.length ? names : ['Brinde'];
    const count = list.length % 2 === 0 || list.length === 1 ? list.length : list.length; // mantém todos
    const size = canvas.width;
    const c = size / 2;
    const radius = c - 20;
    const inner = radius - 22;
    const hub = size * 0.11;
    const slice = (Math.PI * 2) / count;

    const draw = (rot: number) => {
      ctx.clearRect(0, 0, size, size);
      // aro
      ctx.beginPath();
      ctx.arc(c, c, radius, 0, Math.PI * 2);
      const rim = ctx.createRadialGradient(c, c, inner, c, c, radius);
      rim.addColorStop(0, '#B91C1C');
      rim.addColorStop(0.5, '#991B1B');
      rim.addColorStop(1, '#6B1212');
      ctx.fillStyle = rim;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c, c, inner, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFF';
      ctx.stroke();

      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(rot);
      for (let i = 0; i < count; i++) {
        const a0 = i * slice;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, inner, a0, a0 + slice);
        ctx.closePath();
        const red = count % 2 === 1 && i === count - 1 ? '#991B1B' : i % 2 === 0 ? '#C81E1E' : '#FFFFFF';
        const light = red === '#FFFFFF';
        ctx.fillStyle = red;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = light ? '#E2E8F0' : '#7F1D1D';
        ctx.stroke();

        // Texto sempre legível: nas fatias que ficam do lado esquerdo o texto é virado 180°
        const mid = a0 + slice / 2;
        const screenAngle = Math.atan2(Math.sin(mid + rot), Math.cos(mid + rot));
        const flip = Math.cos(screenAngle) < 0;
        ctx.save();
        ctx.rotate(mid);
        if (flip) ctx.rotate(Math.PI);
        ctx.textAlign = flip ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = light ? '#C81E1E' : '#FFFFFF';
        const maxW = inner - hub - 34;
        const xText = flip ? -(inner - 20) : inner - 20;
        const name = (list[i] || '').trim();
        // Quebra em até 2 linhas e reduz a fonte até caber (nunca corta com reticências)
        const words = name.split(/\s+/);
        let lines = [name];
        if (words.length > 1) {
          let best = 1;
          let bestDiff = Infinity;
          for (let k = 1; k < words.length; k++) {
            const d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length);
            if (d < bestDiff) {
              bestDiff = d;
              best = k;
            }
          }
          lines = name.length > 13 ? [words.slice(0, best).join(' '), words.slice(best).join(' ')] : [name];
        }
        let fs = count >= 10 ? size * 0.028 : count >= 7 ? size * 0.032 : size * 0.038;
        for (;;) {
          ctx.font = `900 ${fs}px "Montserrat", sans-serif`;
          const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
          if (widest <= maxW || fs <= 9) break;
          fs -= 1;
        }
        const lh = fs * 1.12;
        const y0 = -((lines.length - 1) * lh) / 2;
        lines.forEach((l, li) => ctx.fillText(l, xText, y0 + li * lh));
        ctx.restore();
      }
      // pinos
      for (let i = 0; i < count; i++) {
        const ang = i * slice;
        const px = Math.cos(ang) * (radius - 11);
        const py = Math.sin(ang) * (radius - 11);
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#E2E8F0';
        ctx.fill();
      }
      ctx.restore();

      // centro
      ctx.beginPath();
      ctx.arc(c, c, hub, 0, Math.PI * 2);
      ctx.fillStyle = '#991B1B';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#FFF';
      ctx.stroke();
      ctx.fillStyle = '#FFF';
      ctx.font = `900 ${hub * 0.42}px "Montserrat", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GIRE', c, c);
    };

    let raf = 0;
    let rot = 0;
    let start = 0;
    let from = 0;
    let to = 0;
    let pauseUntil = 0;
    const SPIN_MS = 5200;
    const ease = (x: number) => 1 - Math.pow(1 - x, 5);

    const frame = (now: number) => {
      if (now < pauseUntil) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (!start) {
        start = now;
        from = rot;
        to = rot + Math.PI * 2 * (5 + Math.random() * 3) + Math.random() * Math.PI * 2;
        onPhaseRef.current?.('spin');
      }
      const t = Math.min(1, (now - start) / SPIN_MS);
      rot = from + (to - from) * ease(t);
      draw(rot);
      if (t >= 1) {
        start = 0;
        pauseUntil = now + pauseMs;
        // Calcula qual fatia parou exatamente sob o ponteiro superior (-Math.PI / 2)
        const pointerAngle = (((-Math.PI / 2 - rot) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const winIdx = Math.floor(pointerAngle / slice) % count;
        const wonPrize = (list[winIdx] || 'Brinde Especial').trim();
        onPhaseRef.current?.('win', wonPrize);
        window.setTimeout(() => onPhaseRef.current?.('idle', wonPrize), 4200);
      }
      raf = requestAnimationFrame(frame);
    };
    draw(0);
    pauseUntil = performance.now() + 4000; // primeira pausa curta
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join('|'), pauseMs]);

  return (
    <div className="relative aspect-square w-full" style={{ maxWidth: 'min(78vh, 46vw)' }}>
      <canvas ref={canvasRef} width={900} height={900} className="w-full h-full drop-shadow-[0_18px_30px_rgba(153,27,27,0.3)]" />
      {/* Ponteiro */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-1 w-0 h-0"
        style={{
          borderLeft: '22px solid transparent',
          borderRight: '22px solid transparent',
          borderTop: '44px solid #991B1B',
          filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))',
        }}
      />
    </div>
  );
};
