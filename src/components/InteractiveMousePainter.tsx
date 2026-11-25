import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  color: string;
  alpha: number;
  decay: number;
}

/**
 * Efeito elegante de rastro de mouse em vermelho fosco:
 * Ao mover o cursor ou o dedo sobre o fundo branco, deixa uma névoa suave e refinada
 * no tom vermelho fosco oficial da Comercial Fontenele, dissolvendo suavemente.
 */
export const InteractiveMousePainter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Paleta exclusiva em tons de vermelho fosco nobre da marca
  const matteReds = [
    'rgba(150, 14, 10, ',  // Vermelho da logo (#960E0A)
    'rgba(133, 17, 14, ',  // Vermelho escuro fosco (#85110E)
    'rgba(168, 27, 27, ',  // Vermelho carmim fosco (#A81B1B)
    'rgba(120, 13, 11, ',  // Vinho fosco (#780D0B)
    'rgba(186, 28, 28, ',  // Vermelho fosco suave (#BA1C1C)
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const addMist = (x: number, y: number, count = 2) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.8 + 0.2;
        const color = matteReds[Math.floor(Math.random() * matteReds.length)];
        const initSize = Math.random() * 12 + 16;
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: initSize,
          maxSize: initSize * 1.8,
          color,
          alpha: 0.32, // Suave e fosco, sem brilho agressivo
          decay: Math.random() * 0.012 + 0.01,
        });
      }

      if (particlesRef.current.length > 70) {
        particlesRef.current.splice(0, particlesRef.current.length - 70);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        addMist(x, y, 2);

        if (lastPosRef.current) {
          const dx = x - lastPosRef.current.x;
          const dy = y - lastPosRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 18) {
            const steps = Math.min(Math.floor(dist / 14), 4);
            for (let s = 1; s <= steps; s++) {
              const midX = lastPosRef.current.x + (dx * s) / (steps + 1);
              const midY = lastPosRef.current.y + (dy * s) / (steps + 1);
              addMist(midX, midY, 1);
            }
          }
        }
        lastPosRef.current = { x, y };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        addMist(x, y, 2);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size += (p.maxSize - p.size) * 0.04; // Expansão sutil de névoa

        if (p.alpha <= 0.005) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        // Gradiente radial para efeito fosco esfumado suave
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `${p.color}${p.alpha.toFixed(3)})`);
        grad.addColorStop(0.5, `${p.color}${(p.alpha * 0.5).toFixed(3)})`);
        grad.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};
