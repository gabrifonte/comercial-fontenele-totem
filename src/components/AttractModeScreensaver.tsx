import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Monitor,
  Bot,
  Sparkles,
  Touchpad,
  Zap,
  X,
  Lightbulb,
  Gift,
  Camera,
  Star,
  Tv,
} from 'lucide-react';
import { getPromoVideoBlob } from '../utils/videoStorage';
import { INSTAGRAM_HANDLE } from '../config/links';
import { MarketingConfig } from '../config/marketing';
import { OFFICIAL_LOGO_SRC } from '../utils/mascot';
import { soundManager } from '../utils/audio';
import { DemoWheel, WheelPhase } from './DemoWheel';
import { WheelMascot } from './WheelMascot';
import { AI_MESSAGES } from '../config/aiMessages';
import { PrizeItem } from '../types';

interface AttractModeScreensaverProps {
  config: MarketingConfig;
  prizes?: PrizeItem[];
  onExit: () => void;
}

const AI_QUICK_IDEAS = [
  {
    category: 'Slogan de Balcão',
    text: 'Sua obra merece o melhor: ferragens, elétrica e hidráulica com preço de fábrica!',
  },
  {
    category: 'Promoção Relâmpago',
    text: 'Na compra de 3 itens hidráulicos ou elétricos, ganhe 1 giro extra na roleta!',
  },
  {
    category: 'Chamada para Redes',
    text: 'Tire uma foto no balcão da loja, marque @_comercial_fontenele e ganhe brindes!',
  },
  {
    category: 'Dica do Especialista',
    text: 'Converse com nossos vendedores técnicos para calcular a quantidade exata de material para sua reforma.',
  },
];

export const AttractModeScreensaver: React.FC<AttractModeScreensaverProps> = ({
  config,
  prizes = [],
  onExit,
}) => {
  // Mensagens de IA em ordem embaralhada, trocadas a cada 20 segundos
  const [aiMessages] = useState<string[]>(() => [...AI_MESSAGES].sort(() => Math.random() - 0.5));
  const [aiMsgIndex, setAiMsgIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setAiMsgIndex((i) => (i + 1) % aiMessages.length), 20000);
    return () => window.clearInterval(id);
  }, [aiMessages.length]);
  const [wheelPhase, setWheelPhase] = useState<WheelPhase>('idle');
  const [wonPrize, setWonPrize] = useState<string | undefined>(undefined);
  const activeWheelNames = prizes.filter((p) => p.currentStock > 0 && p.isActive).map((p) => p.name);
  const wheelNames = activeWheelNames.length
    ? activeWheelNames
    : ['Trena 5m', 'Chave Combinada', 'Kit Pintura', 'Vale R$ 20', 'Boné Fontenele', 'Luva Profissional'];
  const handleWheelPhase = useCallback((phase: WheelPhase, prize?: string) => {
    setWheelPhase(phase);
    if (prize) setWonPrize(prize);
  }, []);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [muted, setMuted] = useState(config.videoMuted);
  const [currentMode, setCurrentMode] = useState<'video' | 'promo'>('video');
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  // Modo de acoplamento: 'contain' adapta a qualquer tela sem cortar preços; 'cover' preenche sem bordas
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [showControls, setShowControls] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const promoTimerRef = useRef<number | null>(null);
  const hideControlsTimerRef = useRef<number | null>(null);

  // Carrega vídeo do IndexedDB
  useEffect(() => {
    let activeUrl: string | null = null;
    let cancelled = false;

    getPromoVideoBlob()
      .then((blob) => {
        if (cancelled) return;
        if (blob && blob.size > 0) {
          activeUrl = URL.createObjectURL(blob);
          setVideoUrl(activeUrl);
          setCurrentMode('video');
        } else {
          setCurrentMode('promo');
        }
      })
      .catch(() => {
        if (!cancelled) setCurrentMode('promo');
      });

    return () => {
      cancelled = true;
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, []);

  // Forçar autoplay imediato e mudo no vídeo
  const handleVideoMount = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el) {
        el.muted = muted;
        el.defaultMuted = muted;
        const p = el.play();
        if (p !== undefined) {
          p.catch(() => {
            el.muted = true;
            el.play().catch(() => {});
          });
        }
      }
    },
    [muted]
  );

  // Alternância: Rola o vídeo até o fim -> Fica 2 minutos na Roleta -> Volta para o vídeo
  const handleVideoEnded = () => {
    if (!config.showRoletaBanners) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    setCurrentMode('promo');
    const durationMs = (config.bannerDurationSec || 120) * 1000;
    if (promoTimerRef.current) clearTimeout(promoTimerRef.current);

    promoTimerRef.current = window.setTimeout(() => {
      setCurrentMode('video');
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, durationMs);
  };

  useEffect(() => {
    return () => {
      if (promoTimerRef.current) clearTimeout(promoTimerRef.current);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, []);

  // Monitora Fullscreen do navegador
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Atividade do mouse: mostra os controles e esconde após 3.5 segundos sem movimento
  const handleUserActivity = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);

    hideControlsTimerRef.current = window.setTimeout(() => {
      // Se o modal de IA estiver aberto, não esconde
      if (!aiModalOpen) {
        setShowControls(false);
      }
    }, 3500);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    setMuted((m) => {
      const next = !m;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  const openAiModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    setAiModalOpen(true);
  };

  const handleGoToRoleta = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    onExit();
  };

  return (
    <div
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onClick={handleUserActivity}
      className="fixed inset-0 z-[200] bg-black flex flex-col justify-between overflow-hidden select-none cursor-default"
    >
      {/* 1. VÍDEO ACOPLADO INTELIGENTE (Adaptação responsiva sem cortar preços) */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#140303] via-[#0A0202] to-[#140303] overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          {videoUrl && currentMode === 'video' ? (
            <motion.div
              key="video-layer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="w-full h-full flex items-center justify-center"
            >
              <video
                ref={handleVideoMount}
                src={videoUrl}
                autoPlay
                playsInline
                muted={muted}
                onEnded={handleVideoEnded}
                /* object-contain garante acoplamento perfeito em qualquer resolução sem cortar preços */
                className={`w-full h-full ${
                  fitMode === 'contain' ? 'object-contain' : 'object-cover'
                } transition-all duration-300`}
              />
            </motion.div>
          ) : (
            /* Slide de Propaganda da Roleta (alternado por 2 minutos) */
            <motion.div
              key="promo-layer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="w-full h-full bg-[#FAF8F5] flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-14 p-6 sm:p-10 relative overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center w-full lg:w-1/2">
                <DemoWheel onPhase={handleWheelPhase} names={wheelNames} />
              </div>

              <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left gap-3.5 max-w-xl lg:pt-20 text-[#C81E1E] font-['Montserrat',sans-serif]">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-red-100 bg-[#991B1B]">
                  <img src={OFFICIAL_LOGO_SRC} alt="Comercial Fontenele" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm sm:text-base font-black tracking-widest uppercase text-[#991B1B]">
                  Roleta de Prêmios • Comercial Fontenele
                </span>
                <h1 className="text-3xl sm:text-5xl font-black leading-tight">
                  A cada <span className="text-[#991B1B]">R$ 100</span> em compras, você tem chance de ganhar prêmios!
                </h1>
                <p className="text-2xl sm:text-4xl font-black tracking-tight text-[#991B1B]">
                  Comprou, seguiu, ganhou!! 🎁
                </p>
                <p className="text-sm sm:text-lg font-bold text-[#C81E1E]/80">
                  Siga {INSTAGRAM_HANDLE} no Instagram e gire a roleta
                </p>

                {/* Mensagem de IA (troca a cada 20s) */}
                <div className="w-full mt-1 min-h-[5.5rem] rounded-2xl border-2 border-red-100 bg-red-50/60 px-5 py-4 flex items-center gap-3 shadow-sm">
                  <Sparkles className="w-6 h-6 shrink-0 text-[#C81E1E]" />
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={aiMsgIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      className="text-base sm:text-xl font-bold text-[#991B1B] leading-snug text-left"
                    >
                      {aiMessages[aiMsgIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              <WheelMascot phase={wheelPhase} wonPrize={wonPrize} availablePrizes={wheelNames} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. CONTROLES QUE SÓ APARECEM AO MEXER O MOUSE (Quando parado, vídeo fica 100% livre) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 pointer-events-none"
          >
            {/* Barra Superior de Controles */}
            <div className="flex items-center justify-between w-full pointer-events-auto">
              {/* Logo da Loja */}
              <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 shadow-lg">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/30 bg-[#991B1B]">
                  <img src={OFFICIAL_LOGO_SRC} alt="Comercial Fontenele" className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-black text-sm tracking-wide font-['Montserrat',sans-serif]">
                  Comercial Fontenele
                </span>
              </div>

              {/* Botões: Som + Tela Cheia + Opções de IA */}
              <div className="flex items-center gap-2">
                {/* Opções de IA */}
                <button
                  type="button"
                  onClick={openAiModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/80 to-red-600/80 hover:from-amber-500 hover:to-red-600 backdrop-blur-md text-white text-xs font-bold border border-white/30 shadow-lg transition-all cursor-pointer"
                  title="Abrir ideias de marketing da IA"
                >
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline">Opções de IA</span>
                </button>

                {/* Tirar / Deixar Som */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg transition-all cursor-pointer"
                  title={muted ? 'Ligar som' : 'Tirar som'}
                >
                  {muted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  <span>{muted ? 'Mudo' : 'Com Som'}</span>
                </button>

                {/* Ajuste de Tela (Sem Cortar Preços) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playClick();
                    setFitMode((m) => (m === 'contain' ? 'cover' : 'contain'));
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg transition-all cursor-pointer"
                  title={fitMode === 'contain' ? 'Exibindo vídeo inteiro (sem cortar preços)' : 'Preenchendo toda a tela'}
                >
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>{fitMode === 'contain' ? 'Sem Cortar Preços' : 'Preencher Tela'}</span>
                </button>

                {/* Tela Cheia / Sair da Tela Cheia */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg transition-all cursor-pointer"
                  title="Alternar tela cheia"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span>{isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}</span>
                </button>
              </div>
            </div>

            {/* Barra Inferior: Botão Chamativo de IR PARA A ROLETA */}
            <div className="flex items-center justify-center w-full pb-3 pointer-events-auto">
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToRoleta}
                className="flex items-center gap-3 px-8 sm:px-12 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#C81E1E] via-[#B91C1C] to-[#991B1B] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-black text-base sm:text-xl uppercase tracking-wider shadow-2xl border-2 border-white/40 cursor-pointer font-['Montserrat',sans-serif]"
              >
                <Touchpad className="w-6 h-6 text-amber-300 animate-bounce" />
                <span>Toque para Girar a Roleta</span>
                <Zap className="w-6 h-6 fill-amber-300 text-amber-300" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MODAL DE OPÇÕES DE IA (Abre ao clicar em 'Opções de IA') */}
      <AnimatePresence>
        {aiModalOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 flex flex-col gap-4 text-[#111827]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-['Montserrat',sans-serif]">
                      Assistente de Marketing IA
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ideias ativas para a TV e o balcão da Comercial Fontenele
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Ideias Rápidas */}
              <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {AI_QUICK_IDEAS.map((idea, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#C81E1E] flex items-center gap-1 font-['Montserrat',sans-serif]">
                      <Lightbulb className="w-3 h-3" /> {idea.category}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                      "{idea.text}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Para editar ou gerar novas frases, acesse o <strong>Modo Gerente &gt; Marketing & TV</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer font-['Montserrat',sans-serif]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
