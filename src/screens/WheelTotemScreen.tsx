import React, { useState } from 'react';
import { PrizeItem } from '../types';
import { WheelCanvas } from '../components/WheelCanvas';
import { WinnerModal } from '../components/WinnerModal';
import { InteractiveMousePainter } from '../components/InteractiveMousePainter';
import {
  RotateCw,
  Zap,
  ShieldCheck,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Touchpad,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { OFFICIAL_LOGO_SRC } from '../utils/mascot';

interface WheelTotemScreenProps {
  prizes: PrizeItem[];
  onNavigateToInventory: () => void;
  onRecordWin: (winner: PrizeItem) => void;
  /** Called when the winner modal is dismissed (confirmed or closed), so the app can go back to the QR code screen. */
  onSpinComplete?: () => void;
}

export const WheelTotemScreen: React.FC<WheelTotemScreenProps> = ({
  prizes,
  onNavigateToInventory,
  onRecordWin,
  onSpinComplete,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<PrizeItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activePrizes = prizes.filter((p) => p.currentStock > 0 && p.isActive);

  const handleSpinStart = () => {
    setIsSpinning(true);
    soundManager.playClick();
  };

  const handleSpinEnd = (winner: PrizeItem) => {
    setIsSpinning(false);
    setCurrentWinner(winner);
    setWinnerModalOpen(true);
  };

  const handleConfirmDelivery = () => {
    if (currentWinner) {
      onRecordWin(currentWinner);
    }
    setWinnerModalOpen(false);
    onSpinComplete?.();
  };

  const handleCloseModal = () => {
    setWinnerModalOpen(false);
    onSpinComplete?.();
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative flex-1 w-full min-h-screen bg-white flex flex-col justify-between selection:bg-[#C81E1E] selection:text-white overflow-hidden">
      {/* Interactive Mouse Painting Canvas: Vermelho fosco suave e refinado */}
      <InteractiveMousePainter />

      {/* Top Header */}
      <header className="relative z-20 h-18 px-4 sm:px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs flex items-center justify-between">
        {/* Left: Brand Logo & Typography */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm border border-red-200 bg-[#991B1B] shrink-0">
            <img
              src={OFFICIAL_LOGO_SRC}
              alt="Comercial Fontenele"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="font-bold text-xl tracking-tight text-[#111827] font-['Montserrat',sans-serif]">
              Comercial
            </span>
            <span className="font-black text-2xl tracking-tight text-[#C81E1E] font-['Montserrat',sans-serif] uppercase">
              FONTENELE
            </span>
          </div>
        </div>

        {/* Right Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Chip: Modo Totem de Balcão */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-[#C81E1E] font-['Montserrat',sans-serif]">
            <span className="w-2 h-2 rounded-full bg-[#C81E1E] animate-pulse" />
            <span className="uppercase tracking-wider">Modo Totem de Balcão</span>
          </div>

          {/* Chip: Balcão Oficial Ativo */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Balcão Oficial Ativo</span>
          </div>

          {/* Button: Modo Gerente (xpath: //button[@id='openManagerDrawerBtn']) */}
          <button
            id="openManagerDrawerBtn"
            onClick={() => {
              soundManager.playClick();
              onNavigateToInventory();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-sky-300 bg-white hover:bg-sky-50 text-sky-800 text-xs sm:text-sm font-bold font-['Montserrat',sans-serif] transition-all cursor-pointer shadow-2xs"
            title="Acessar Estoque de Brindes e Painel do Gerente"
          >
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Modo Gerente</span>
          </button>

          {/* Button: Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold font-['Montserrat',sans-serif] transition-all cursor-pointer shadow-2xs"
            title="Alternar tela cheia"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Wheel Showcase Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-6xl mx-auto w-full my-auto gap-2 sm:gap-3">
        {/* Main Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight font-['Montserrat',sans-serif]">
            <span className="text-[#1E293B]">ROLETA PREMIADA </span>
            <span className="text-[#C81E1E]">FONTENELE</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm md:text-base font-semibold text-[#64748B]">
            Toque na roleta, no botão central ou pressione <kbd className="px-1.5 py-0.5 text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded text-slate-800 shadow-2xs">ESPAÇO</kbd> para girar a sorte!
          </p>
        </div>

        {/* Realistic Mechanical Wheel with Full Names and Increased Size */}
        <div className="relative my-2 sm:my-3">
          <WheelCanvas
            prizes={prizes}
            isSpinning={isSpinning}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
            disabled={activePrizes.length === 0}
          />
        </div>

        {/* Bottom CTA Button */}
        <div className="mt-1 sm:mt-2 flex flex-col items-center z-20">
          <button
            onClick={() => {
              if (!isSpinning && activePrizes.length > 0) {
                const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
                window.dispatchEvent(spaceEvent);
              } else if (prizes.length === 0) {
                onNavigateToInventory();
              }
            }}
            disabled={isSpinning || (activePrizes.length === 0 && prizes.length > 0)}
            className={`py-3.5 sm:py-4.5 px-8 sm:px-14 rounded-2xl font-black text-lg sm:text-2xl tracking-wider uppercase transition-all flex items-center justify-center gap-3 shadow-xl font-['Montserrat',sans-serif] ${
              isSpinning
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : prizes.length === 0
                ? 'bg-[#C81E1E] hover:bg-[#991B1B] text-white cursor-pointer shadow-red-700/35'
                : activePrizes.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-[#B91C1C] hover:bg-[#991B1B] active:scale-98 text-white shadow-red-700/35 cursor-pointer'
            }`}
          >
            <RotateCw className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>
              {isSpinning
                ? 'ROLETA GIRANDO...'
                : prizes.length === 0
                ? 'CADASTRAR PRIMEIRO BRINDE'
                : activePrizes.length === 0
                ? 'BRINDES ESGOTADOS OU PAUSADOS'
                : 'GIRAR ROLETA'}
            </span>
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-300 text-amber-300" />
          </button>

          {/* Subtext under button */}
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
            {prizes.length === 0 ? (
              <span>Sistema 100% zerado • Clique no botão ou em <strong>Modo Gerente</strong> no topo para cadastrar produtos</span>
            ) : (
              <>
                <Touchpad className="w-4 h-4 text-[#C81E1E]" />
                <span>Toque no botão, na roleta ou aperte <strong className="text-slate-800">ESPAÇO</strong> no teclado</span>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="relative z-20 h-12 px-4 sm:px-8 border-t border-slate-200 bg-white/95 backdrop-blur-xs flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Totem Interativo de Premiação • Comercial Fontenele © 2024</span>
        </div>
        <div className="font-semibold text-red-600">
          Física de Rotação Automática Ativa
        </div>
      </footer>

      {/* Winner Modal */}
      <WinnerModal
        isOpen={winnerModalOpen}
        winner={currentWinner}
        onConfirmDelivery={handleConfirmDelivery}
        onClose={handleCloseModal}
      />
    </div>
  );
};
