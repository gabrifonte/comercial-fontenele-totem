import React, { useRef, useEffect, useCallback } from 'react';
import { PrizeItem } from '../types';
import { soundManager } from '../utils/audio';
import { OFFICIAL_LOGO_SRC } from '../utils/mascot';

interface WheelCanvasProps {
  prizes: PrizeItem[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (winner: PrizeItem) => void;
  disabled?: boolean;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  prizes,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flapperRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Active prizes in rotation with currentStock > 0 and isActive === true
  const activePrizes = prizes.filter((p) => p.currentStock > 0 && p.isActive);
  const sliceCount = Math.max(1, activePrizes.length);

  // Mutable animation state (no React re-renders during 60fps spin)
  const stateRef = useRef({
    rotation: 0,
    isSpinning: false,
    startTime: 0,
    duration: 5200, // ms
    startRotation: 0,
    targetRotation: 0,
    lastPegIndex: -1,
    flapperDeflection: 0,
    activePrizes: activePrizes,
    hoveredSlice: -1,
    isHovering: false,
  });

  // Quintic ease-out deceleration curve for natural mechanical deceleration
  const easeOutQuint = (x: number): number => {
    return 1 - Math.pow(1 - x, 5);
  };

  // Helper to get alternating colors that never place two identical colors side by side
  const getSliceBackground = (index: number, total: number, prize: PrizeItem) => {
    // If prize has a distinct custom color set by manager
    if (prize.color && prize.color !== '#C81E1E' && prize.color !== '#FFFFFF') {
      return prize.color;
    }

    if (total === 1) return '#C81E1E';

    if (total % 2 === 0) {
      return index % 2 === 0 ? '#C81E1E' : '#FFFFFF';
    } else {
      // Odd number of slices: last slice gets distinct dark crimson accent
      if (index === total - 1) {
        return '#991B1B';
      }
      return index % 2 === 0 ? '#C81E1E' : '#FFFFFF';
    }
  };

  const isLightColor = (hex: string) => {
    return hex === '#FFFFFF' || hex.toLowerCase() === '#fff' || hex === '#FEF08A' || hex === '#FED7AA';
  };

  // Draw wheel function
  const drawWheel = useCallback((rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const radius = center - 30; // 370px on 800x800 canvas
    const innerRadius = radius - 30; // 340px
    const centerHubRadius = 88; // 88px inner hub radius
    const currentActive = stateRef.current.activePrizes;
    const count = Math.max(1, currentActive.length);
    const sliceAngle = (Math.PI * 2) / count;
    const s = stateRef.current;

    ctx.clearRect(0, 0, width, height);

    // 1. Soft atmospheric drop shadow underneath the entire wheel
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center + 10, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(153, 27, 27, 0.22)';
    ctx.filter = 'blur(22px)';
    ctx.fill();
    ctx.restore();

    // 2. Outer Rim in Deep Brick Red (#991B1B) with metallic chrome trims
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#991B1B';
    ctx.fill();

    // Outer rim bevel shading
    const rimGrad = ctx.createRadialGradient(center, center, innerRadius, center, center, radius);
    rimGrad.addColorStop(0, '#B91C1C');
    rimGrad.addColorStop(0.5, '#991B1B');
    rimGrad.addColorStop(1, '#6B1212');
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Rim inner white border ring
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Rim outer thin white border
    ctx.beginPath();
    ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();
    ctx.restore();

    // 3. Slices
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotationAngle);

    if (currentActive.length === 0) {
      // Empty state wheel when all stock is 0 or inactive
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#F1F5F9';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#CBD5E1';
      ctx.stroke();

      ctx.save();
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 18px "Montserrat", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Nenhum brinde ativo no momento', 0, 180);
      ctx.font = '500 13px "Montserrat", sans-serif';
      ctx.fillText('Ative ou cadastre itens no Modo Gerente', 0, 208);
      ctx.restore();
    } else {
      for (let i = 0; i < count; i++) {
        const prize = currentActive[i];
        const startAngle = i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, innerRadius, startAngle, endAngle);
        ctx.closePath();

        const baseFill = getSliceBackground(i, count, prize);
        const isLight = isLightColor(baseFill);
        const isHovered = s.isHovering && s.hoveredSlice === i;

        // Interactive cursor coloring: if mouse hovers on white slices, color it with vibrant amber/gold
        let sliceFill = baseFill;
        if (!s.isSpinning && isHovered) {
          if (isLight) {
            const hoverGrad = ctx.createRadialGradient(0, 0, centerHubRadius, 0, 0, innerRadius);
            hoverGrad.addColorStop(0, '#FEF08A');
            hoverGrad.addColorStop(0.65, '#FDE047');
            hoverGrad.addColorStop(1, '#FED7AA');
            sliceFill = hoverGrad as unknown as string;
          } else {
            sliceFill = '#B91C1C';
          }
        }

        ctx.fillStyle = sliceFill;
        ctx.fill();

        // Divider line between slices
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isLight ? '#E2E8F0' : '#7F1D1D';
        ctx.stroke();

        // Draw FULL prize name (Never truncated)
        ctx.save();
        const midAngle = startAngle + sliceAngle / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const fullName = (prize.name || '').trim();

        // Word wrap into 1 or 2 lines
        const words = fullName.split(/\s+/);
        let lines: string[] = [];

        if (words.length <= 1 || fullName.length <= 12) {
          lines = [fullName];
        } else if (words.length === 2) {
          lines = words;
        } else {
          let line1 = words[0];
          let wIdx = 1;
          const halfLen = Math.ceil(words.length / 2);
          while (wIdx < words.length && (line1 + ' ' + words[wIdx]).length <= 14 && wIdx < halfLen) {
            line1 += ' ' + words[wIdx];
            wIdx++;
          }
          const line2 = words.slice(wIdx).join(' ');
          lines = [line1, line2];
        }

        // Dynamic font size according to number of slices and length
        let fontSize = 16;
        if (count >= 10) {
          fontSize = 12;
        } else if (count >= 8) {
          fontSize = lines.length > 1 ? 13 : 15;
        } else if (count >= 5) {
          fontSize = lines.length > 1 ? 14 : 17;
        } else {
          fontSize = lines.length > 1 ? 16 : 19;
        }

        ctx.font = `900 ${fontSize}px "Montserrat", sans-serif`;

        const lineHeight = fontSize + 4;
        const totalHeight = (lines.length - 1) * lineHeight;
        const startY = -totalHeight / 2;
        const xPos = innerRadius - 26; // Positioned near outer rim, reading outward -> in

        lines.forEach((lineText, idx) => {
          const yPos = startY + idx * lineHeight;
          if (isLight) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
            ctx.shadowBlur = 1;
            ctx.fillStyle = isHovered ? '#7F1D1D' : '#C81E1E';
          } else {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 3;
            ctx.fillStyle = '#FFFFFF';
          }
          ctx.fillText(lineText, xPos, yPos);
        });

        ctx.restore();
      }
    }

    // 4. Metallic Chrome Divider Pegs around outer rim
    const pegCount = currentActive.length > 0 ? count : 8;
    const pegAngleStep = (Math.PI * 2) / pegCount;

    for (let i = 0; i < pegCount; i++) {
      const pegAngle = i * pegAngleStep;
      const pegDist = radius - 15;
      const px = Math.cos(pegAngle) * pegDist;
      const py = Math.sin(pegAngle) * pegDist;

      // Chrome Peg Shadow
      ctx.beginPath();
      ctx.arc(px, py, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();

      // Chrome Peg Body
      ctx.beginPath();
      ctx.arc(px - 0.5, py - 0.5, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();

      // Chrome Peg Bevel
      const pegGrad = ctx.createLinearGradient(px - 4, py - 4, px + 4, py + 4);
      pegGrad.addColorStop(0, '#FFFFFF');
      pegGrad.addColorStop(0.5, '#CBD5E1');
      pegGrad.addColorStop(1, '#64748B');
      ctx.fillStyle = pegGrad;
      ctx.fill();

      // Specular Highlight
      ctx.beginPath();
      ctx.arc(px - 1.5, py - 1.5, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    ctx.restore();

    // 5. Center Hub Ring in Canvas
    ctx.save();
    ctx.translate(center, center);

    // Drop shadow under center badge
    ctx.beginPath();
    ctx.arc(0, 0, centerHubRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.filter = 'blur(6px)';
    ctx.fill();

    // Outer Red Border of Center Hub
    ctx.beginPath();
    ctx.arc(0, 0, centerHubRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#991B1B';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.restore();
  }, []);

  // Sync stateRef.current.activePrizes and redraw wheel immediately when prizes change
  useEffect(() => {
    stateRef.current.activePrizes = activePrizes;
    drawWheel(stateRef.current.rotation);
  }, [activePrizes, drawWheel]);

  // Initial draw on mount
  useEffect(() => {
    drawWheel(stateRef.current.rotation);
  }, [drawWheel]);

  // Animation frame handler
  const animate = (timestamp: number) => {
    const s = stateRef.current;
    if (!s.isSpinning) {
      drawWheel(s.rotation);
      return;
    }

    const elapsed = timestamp - s.startTime;
    const progress = Math.min(elapsed / s.duration, 1);
    const easeProgress = easeOutQuint(progress);

    // Rotation angle
    s.rotation = s.startRotation + (s.targetRotation - s.startRotation) * easeProgress;
    s.rotation = ((s.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    // Peg collision calculation with top pointer at 3*PI/2 (top center)
    const currentActive = s.activePrizes;
    const count = Math.max(1, currentActive.length);
    const sliceAngle = (Math.PI * 2) / count;
    const pointerPos = (3 * Math.PI) / 2;
    const relAngle = ((pointerPos - s.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const currentPeg = Math.floor(relAngle / sliceAngle);

    if (currentPeg !== s.lastPegIndex) {
      s.lastPegIndex = currentPeg;
      s.flapperDeflection = -26; // Deflect pointer
      const speedFactor = (1 - progress) * 8;
      soundManager.playPegClick(speedFactor);
    }

    // Spring pointer back to 0 without React state update
    s.flapperDeflection += (0 - s.flapperDeflection) * 0.25;
    if (flapperRef.current) {
      flapperRef.current.style.transform = `rotate(${s.flapperDeflection}deg)`;
    }

    drawWheel(s.rotation);

    if (progress < 1) {
      animFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      // Completed spin!
      s.isSpinning = false;
      s.flapperDeflection = 0;
      if (flapperRef.current) {
        flapperRef.current.style.transform = 'rotate(0deg)';
      }

      // Determine winning slice
      const winningIndex = Math.floor(relAngle / sliceAngle) % count;
      const winner = currentActive[winningIndex] || currentActive[0];
      soundManager.stopSuspenseMusic();
      soundManager.playWinFanfare();
      onSpinEnd(winner);
    }
  };

  const startSpin = useCallback(() => {
    const s = stateRef.current;
    if (s.isSpinning || disabled || activePrizes.length === 0) return;

    onSpinStart();
    s.isSpinning = true;
    s.startTime = performance.now();
    s.startRotation = s.rotation;
    s.isHovering = false;

    // 6 to 9 full spins + random offset
    const fullSpins = 7;
    const randomOffset = Math.random() * Math.PI * 2;
    s.targetRotation = s.startRotation + fullSpins * Math.PI * 2 + randomOffset;
    s.duration = 5200 + (Math.random() - 0.5) * 400;
    s.lastPegIndex = -1;

    // Suspense music removed upon request
    // soundManager.startSuspenseMusic(s.duration / 1000 + 0.6);

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    animFrameIdRef.current = requestAnimationFrame(animate);
  }, [disabled, activePrizes.length, onSpinStart]);

  // Spacebar to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        startSpin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startSpin]);

  // Never leave the suspense music playing if the wheel unmounts mid-spin
  useEffect(() => {
    return () => {
      soundManager.stopSuspenseMusic(true);
    };
  }, []);

  // Pointer drag gesture & hover slice calculation
  const isDraggingRef = useRef(false);
  const dragStartAngle = useRef(0);
  const dragCurrentAngle = useRef(0);
  const dragStartTime = useRef(0);

  const getAngle = (clientX: number, clientY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (stateRef.current.isSpinning || disabled || activePrizes.length === 0) return;
    isDraggingRef.current = true;
    const angle = getAngle(e.clientX, e.clientY);
    dragStartAngle.current = angle;
    dragCurrentAngle.current = angle;
    dragStartTime.current = performance.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const radius = rect.width / 2;

    const s = stateRef.current;
    const currentActive = s.activePrizes;
    const count = Math.max(1, currentActive.length);

    // Detect hover on slices (between center hub and outer rim)
    if (dist >= 50 && dist <= radius && !s.isSpinning && currentActive.length > 0) {
      s.isHovering = true;
      const mouseAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const relAngle = ((mouseAngle - s.rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const sliceAngle = (Math.PI * 2) / count;
      const hoveredIdx = Math.floor(relAngle / sliceAngle) % count;

      if (s.hoveredSlice !== hoveredIdx) {
        s.hoveredSlice = hoveredIdx;
        drawWheel(s.rotation);
      }
    } else {
      if (s.isHovering) {
        s.isHovering = false;
        s.hoveredSlice = -1;
        drawWheel(s.rotation);
      }
    }

    if (!isDraggingRef.current || s.isSpinning) return;
    const angle = getAngle(e.clientX, e.clientY);
    let delta = angle - dragCurrentAngle.current;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    s.rotation += delta;
    s.rotation = ((s.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    dragCurrentAngle.current = angle;
    drawWheel(s.rotation);
  };

  const handlePointerLeave = () => {
    const s = stateRef.current;
    if (s.isHovering) {
      s.isHovering = false;
      s.hoveredSlice = -1;
      drawWheel(s.rotation);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const elapsed = performance.now() - dragStartTime.current;
    if (elapsed < 350 || Math.abs(dragCurrentAngle.current - dragStartAngle.current) > 0.3) {
      startSpin();
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Top Pointer matching Image 1: circular pin with red center and sharp red arrow pointing down */}
      <div
        ref={flapperRef}
        className="absolute -top-7 sm:-top-8 z-20 pointer-events-none drop-shadow-xl will-change-transform"
        style={{
          transformOrigin: 'top center',
          transform: 'rotate(0deg)',
        }}
      >
        <div className="flex flex-col items-center">
          {/* Circular mounting pin */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-slate-300 shadow-md flex items-center justify-center p-1">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#991B1B] border border-white" />
          </div>
          {/* Red arrow pointing down */}
          <div className="-mt-1 w-0 h-0 border-l-[10px] sm:border-l-[12px] border-l-transparent border-r-[10px] sm:border-r-[12px] border-r-transparent border-t-[18px] sm:border-t-[22px] border-t-[#C81E1E] drop-shadow-sm" />
        </div>
      </div>

      {/* Main Wheel Canvas with Standard, Perfectly Circular Proportions */}
      <div className="relative w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[520px] md:h-[520px] lg:w-[560px] lg:h-[560px] aspect-square rounded-full flex items-center justify-center shrink-0">
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`w-full h-full block rounded-full touch-none select-none ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:scale-[1.01]'
          } transition-transform duration-200`}
        />

        {/* Center Hub Button with Official Comercial Fontenele Logo (balanced standard proportions) */}
        <button
          type="button"
          onClick={startSpin}
          disabled={isSpinning || disabled || activePrizes.length === 0}
          className="absolute z-10 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden shadow-2xl border-4 border-white hover:scale-105 active:scale-95 transition-transform cursor-pointer bg-[#991B1B] flex flex-col items-center justify-center p-0.5 group"
          title="Clique para girar a Roleta Comercial Fontenele"
        >
          <img
            src={OFFICIAL_LOGO_SRC}
            alt="Logo Comercial Fontenele"
            className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
          />
        </button>
      </div>
    </div>
  );
};
