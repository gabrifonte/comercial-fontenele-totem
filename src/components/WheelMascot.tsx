import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WheelPhase } from './DemoWheel';
import {
  MascotPoseName,
  MascotDecision,
  buildPrizeSpecificReaction,
  buildSpinningReaction,
  nextAutonomousLifeDecision,
  enrichMascotThoughtsWithGemini,
} from '../utils/mascotBrain';
import { loadAllVeoClipUrls, VeoClipSlot } from '../utils/veo3Engine';

const BASE = import.meta.env.BASE_URL;

const POSE_FILES: Record<MascotPoseName, string> = {
  hero_toolbox: `${BASE}assets/mascot/hero_toolbox.png`,
  hero_point: `${BASE}assets/mascot/hero_point.png`,
  hero_jump_wrench: `${BASE}assets/mascot/hero_jump_wrench.png`,
  hero_spin: `${BASE}assets/mascot/hero_spin.png`,
  paint: `${BASE}assets/mascot/paint.png`,
  paint_down: `${BASE}assets/mascot/paint_down.png`,
  wrench: `${BASE}assets/mascot/wrench.png`,
  drill: `${BASE}assets/mascot/drill.png`,
  gift: `${BASE}assets/mascot/gift.png`,
  present: `${BASE}assets/mascot/present.png`,
  thumbsup: `${BASE}assets/mascot/thumbsup.png`,
  point: `${BASE}assets/mascot/point.png`,
};

const POSE_SCALE: Record<MascotPoseName, number> = {
  hero_toolbox: 0.98,
  hero_point: 0.98,
  hero_jump_wrench: 1.0,
  hero_spin: 0.94,
  paint: 1.02,
  paint_down: 1.02,
  wrench: 0.88,
  drill: 0.96,
  gift: 0.96,
  present: 0.96,
  thumbsup: 0.96,
  point: 0.96,
};

interface WheelMascotProps {
  phase: WheelPhase;
  wonPrize?: string;
  availablePrizes?: string[];
}

const MascotSkeletalCanvas: React.FC<{
  pose: MascotPoseName;
  phase: WheelPhase;
}> = ({ pose, phase }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Partial<Record<MascotPoseName, HTMLImageElement>>>({});
  const stateRef = useRef<{
    currentPose: MascotPoseName;
    prevPose: MascotPoseName;
    transitionStart: number;
    transitionDuration: number;
  }>({
    currentPose: pose,
    prevPose: pose,
    transitionStart: performance.now(),
    transitionDuration: 420,
  });

  useEffect(() => {
    (Object.keys(POSE_FILES) as MascotPoseName[]).forEach((key) => {
      const img = new Image();
      img.src = POSE_FILES[key];
      img.onload = () => {
        imagesRef.current[key] = img;
      };
    });
  }, []);

  useEffect(() => {
    const st = stateRef.current;
    if (st.currentPose !== pose) {
      st.prevPose = st.currentPose;
      st.currentPose = pose;
      st.transitionStart = performance.now();
    }
  }, [pose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const W = canvas.width;
    const H = canvas.height;
    const STRIPS = 40;

    const drawDeformedCharacter = (
      img: HTMLImageElement,
      poseKey: MascotPoseName,
      alpha: number,
      nowSec: number,
      anticipationDip: number
    ) => {
      if (alpha <= 0.01) return;
      const scale = POSE_SCALE[poseKey] || 1.0;
      const targetH = H * 0.9 * scale;
      const aspect = img.width / Math.max(1, img.height);
      const targetW = targetH * aspect;

      const baseX = (W - targetW) / 2;
      const groundY = H - 8;

      const isJump = poseKey === 'hero_jump_wrench';
      const isPainting = poseKey === 'paint' || poseKey === 'paint_down';
      const isSpinPhase = phase === 'spin';

      const jumpLift = isJump ? Math.abs(Math.sin(nowSec * 4.2)) * 8 : 0;
      const shadowScale = 1 - jumpLift / 45;
      ctx.save();
      ctx.globalAlpha = alpha * 0.2;
      ctx.fillStyle = '#450A0A';
      ctx.beginPath();
      ctx.ellipse(
        W / 2,
        groundY + 2,
        Math.max(16, targetW * 0.34 * shadowScale),
        5 * shadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      const srcStripH = img.height / STRIPS;
      const dstStripH = targetH / STRIPS;

      ctx.save();
      ctx.globalAlpha = alpha;

      for (let i = 0; i < STRIPS; i++) {
        const u = i / (STRIPS - 1);
        const upperWeight = Math.pow(1 - u, 1.45);
        const chestWeight = Math.sin(u * Math.PI) * (1 - u * 0.5);

        const breathY = Math.sin(nowSec * 2.4) * 2.4 * upperWeight;
        const breathScaleX = 1 + Math.sin(nowSec * 2.4) * 0.014 * chestWeight;

        const swayFreq = isSpinPhase ? 4.2 : isPainting ? 3.4 : 1.6;
        const swayAmp = isSpinPhase ? 3.0 : isPainting ? 2.6 : 1.6;
        const swayX = Math.sin(nowSec * swayFreq + u * 1.2) * swayAmp * upperWeight;

        const dipY = anticipationDip * 5.0 * upperWeight;

        const stripW = targetW * breathScaleX;
        const dx = baseX - (stripW - targetW) / 2 + swayX;
        const dy =
          groundY - targetH + i * dstStripH + breathY + dipY - jumpLift;

        ctx.drawImage(
          img,
          0,
          i * srcStripH,
          img.width,
          srcStripH + 0.8,
          dx,
          dy,
          stripW,
          dstStripH + 0.9
        );
      }

      ctx.restore();
    };

    const render = (nowMs: number) => {
      ctx.clearRect(0, 0, W, H);
      const nowSec = nowMs / 1000;
      const st = stateRef.current;

      const elapsed = nowMs - st.transitionStart;
      const rawT = Math.min(1, Math.max(0, elapsed / st.transitionDuration));
      const t =
        rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
      const anticipationDip = Math.sin(rawT * Math.PI);

      const prevImg = imagesRef.current[st.prevPose];
      const currImg = imagesRef.current[st.currentPose];

      if (t < 1 && prevImg && st.prevPose !== st.currentPose) {
        drawDeformedCharacter(prevImg, st.prevPose, 1 - t, nowSec, anticipationDip);
      }
      if (currImg) {
        drawDeformedCharacter(
          currImg,
          st.currentPose,
          t < 1 && st.prevPose !== st.currentPose ? t : 1,
          nowSec,
          anticipationDip
        );
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={340}
      className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
    />
  );
};

export const WheelMascot: React.FC<WheelMascotProps> = ({
  phase,
  wonPrize,
  availablePrizes = [],
}) => {
  const [decision, setDecision] = useState<MascotDecision>(() =>
    nextAutonomousLifeDecision(availablePrizes, wonPrize)
  );
  const [activePose, setActivePose] = useState<MascotPoseName>(decision.pose);
  const [showBubble, setShowBubble] = useState(true);
  const [paintProgress, setPaintProgress] = useState(0);
  const [veoUrls, setVeoUrls] = useState<Partial<Record<VeoClipSlot, string>>>({});

  const availablePrizesRef = useRef(availablePrizes);
  availablePrizesRef.current = availablePrizes;
  const lastWonPrizeRef = useRef(wonPrize);
  if (wonPrize) lastWonPrizeRef.current = wonPrize;

  useEffect(() => {
    let active = true;
    loadAllVeoClipUrls().then((urls) => {
      if (active) setVeoUrls(urls);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    enrichMascotThoughtsWithGemini(availablePrizesRef.current, lastWonPrizeRef.current);
    const id = window.setInterval(() => {
      enrichMascotThoughtsWithGemini(availablePrizesRef.current, lastWonPrizeRef.current);
    }, 45000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
    };

    if (phase === 'spin') {
      const spinDec = buildSpinningReaction(availablePrizesRef.current);
      setDecision(spinDec);
      setActivePose(spinDec.pose);
      setShowBubble(true);
      setPaintProgress(0);

      const toggleId = window.setInterval(() => {
        if (!cancelled) {
          setActivePose((prev) =>
            prev === 'hero_point' ? 'point' : 'hero_point'
          );
        }
      }, 1800);
      return () => {
        cancelled = true;
        window.clearInterval(toggleId);
        timers.forEach(clearTimeout);
      };
    }

    if (phase === 'win') {
      const winDec = buildPrizeSpecificReaction(wonPrize || lastWonPrizeRef.current);
      setDecision(winDec);
      setActivePose(winDec.pose);
      setShowBubble(true);
      setPaintProgress(0);

      if (winDec.secondaryPose) {
        later(() => setActivePose(winDec.secondaryPose!), 2200);
      }

      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const runIdleCycle = () => {
      if (cancelled) return;
      const nextDec = nextAutonomousLifeDecision(
        availablePrizesRef.current,
        lastWonPrizeRef.current
      );
      setDecision(nextDec);
      setActivePose(nextDec.pose);
      setShowBubble(true);

      if (nextDec.propType === 'paint_wall') {
        setPaintProgress(25);
        later(() => {
          setActivePose('paint');
          setPaintProgress(65);
        }, 1400);
        later(() => {
          setActivePose('paint_down');
          setPaintProgress(90);
        }, 2800);
        later(() => {
          setActivePose('thumbsup');
          setPaintProgress(100);
        }, 4200);
      } else {
        setPaintProgress(0);
        if (nextDec.secondaryPose) {
          later(() => {
            setActivePose(nextDec.secondaryPose!);
          }, Math.floor(nextDec.durationMs * 0.55));
        }
      }

      later(() => {
        setShowBubble(false);
      }, nextDec.durationMs - 450);

      later(runIdleCycle, nextDec.durationMs);
    };

    runIdleCycle();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [phase, wonPrize]);

  const activeVeoUrl =
    phase === 'spin'
      ? veoUrls.spin
      : phase === 'win'
        ? veoUrls.win
        : decision.propType !== 'none'
          ? veoUrls.work
          : veoUrls.idle;

  const isThought = decision.bubbleKind === 'thought';

  return (
    <div
      className="absolute top-2.5 right-3 sm:right-6 z-20 pointer-events-none select-none flex items-start justify-end"
      style={{
        height: '142px',
      }}
    >
      {/* Faixa de tinta acrílica vermelha na parede quando está pintando */}
      <div
        className="absolute -top-2 right-1 w-20 overflow-hidden rounded-b-xl pointer-events-none transition-all duration-700 ease-out"
        style={{
          height: `${paintProgress}%`,
          maxHeight: '115px',
          background:
            'linear-gradient(180deg, #DC2626 0%, #B91C1C 85%, #991B1B 100%)',
          boxShadow:
            paintProgress > 0
              ? 'inset 0 -3px 6px rgba(0,0,0,0.2), 0 2px 8px rgba(185,28,28,0.25)'
              : 'none',
          opacity: paintProgress > 0 ? 0.92 : 0,
        }}
      />

      {/* Balão Horizontal Compacto (1 a 2 linhas no topo, nunca estica na vertical nem cobre textos) */}
      <AnimatePresence mode="wait">
        {showBubble && decision.text && (
          <motion.div
            key={decision.id}
            initial={{ opacity: 0, scale: 0.94, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.94, x: 6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`relative mt-1.5 mr-2 w-max max-w-[260px] sm:max-w-[350px] rounded-2xl px-3.5 py-2 shadow-md font-['Montserrat',sans-serif] text-left ${
              isThought
                ? 'bg-[#FFFBEB] border-2 border-amber-400/90 text-[#78350F]'
                : phase === 'win'
                  ? 'bg-[#991B1B] border-2 border-amber-300 text-white'
                  : 'bg-white border-2 border-[#C81E1E] text-[#991B1B]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                  isThought
                    ? 'bg-amber-200/70 text-[#78350F]'
                    : phase === 'win'
                      ? 'bg-amber-300 text-[#7F1D1D]'
                      : 'bg-red-50 text-[#991B1B]'
                }`}
              >
                {decision.activityLabel}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs font-extrabold leading-snug line-clamp-2">
              {decision.text}
            </p>

            {isThought ? (
              <div className="absolute top-4 -right-2.5 flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-[#FFFBEB] border-2 border-amber-400 block" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFBEB] border border-amber-400 block" />
              </div>
            ) : (
              <span
                className={`absolute top-4 -right-1.5 w-2.5 h-2.5 rotate-45 border-t-2 border-r-2 ${
                  phase === 'win'
                    ? 'bg-[#991B1B] border-amber-300'
                    : 'bg-white border-[#C81E1E]'
                }`}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Container do Mascote 3D (Compacto no topo direito) */}
      <div className="relative w-[128px] sm:w-[138px] h-[138px] shrink-0 flex items-end justify-center">
        {/* Confetes sutis ao redor do mascote quando sai prêmio */}
        <AnimatePresence>
          {phase === 'win' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-2 pointer-events-none"
            >
              {[
                { color: '#C81E1E', top: '8%', left: '12%' },
                { color: '#F59E0B', top: '18%', left: '88%' },
                { color: '#10B981', top: '48%', left: '4%' },
                { color: '#E11D48', top: '60%', left: '92%' },
                { color: '#FACC15', top: '75%', left: '18%' },
              ].map((dot, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, y: 6 }}
                  animate={{ scale: [0, 1.2, 0.9], y: [-3, -10, -3] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    delay: i * 0.14,
                  }}
                  className="absolute w-2 h-2 rounded-full shadow-xs"
                  style={{
                    backgroundColor: dot.color,
                    top: dot.top,
                    left: dot.left,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tubulação hidráulica 3D de cobre/latão sincronizada quando ajusta encanamento */}
        <AnimatePresence>
          {decision.propType === 'plumbing_pipe' && phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.3 }}
              className="absolute left-[62%] bottom-1.5 w-16 h-16 pointer-events-none z-10"
            >
              <img
                src={`${BASE}assets/mascot/pipe_3d.png`}
                alt="Tubulação Hidráulica 3D"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {activeVeoUrl ? (
          <video
            key={activeVeoUrl}
            src={activeVeoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain pointer-events-none"
            style={{ mixBlendMode: 'multiply' }}
          />
        ) : (
          <MascotSkeletalCanvas pose={activePose} phase={phase} />
        )}
      </div>
    </div>
  );
};
