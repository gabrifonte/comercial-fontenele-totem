import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { INSTAGRAM_HANDLE } from '../config/links';
import confetti from 'canvas-confetti';
import { PrizeItem } from '../types';
import { OFFICIAL_LOGO_SRC } from '../utils/mascot';
import { ProductThumbnail } from './ProductThumbnails';
import { Gift, CheckCircle2, Sparkles, X } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface WinnerModalProps {
  winner: PrizeItem | null;
  isOpen: boolean;
  onConfirmDelivery: () => void;
  onClose?: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  isOpen,
  onConfirmDelivery,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#C81E1E', '#991B1B', '#F59E0B', '#10B981', '#FFFFFF'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 60,
            origin: { x: 0 },
            colors: ['#C81E1E', '#FFFFFF'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 60,
            origin: { x: 1 },
            colors: ['#C81E1E', '#FFFFFF'],
          });
        }, 220);
      } catch {
        // Fallback
      }
    }
  }, [isOpen]);

  const [selfieQr, setSelfieQr] = useState('');

  useEffect(() => {
    if (!isOpen || !winner) return;
    // QR leva o cliente para a página "Foto do Campeão" com moldura da loja
    const url = `${window.location.origin}/?selfie=1&p=${encodeURIComponent(winner.name)}`;
    QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: '#991B1B', light: '#FFFFFF' } })
      .then(setSelfieQr)
      .catch(() => setSelfieQr(''));
  }, [isOpen, winner]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-center relative overflow-hidden">
        {/* Top Decorative Header */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#991B1B] via-[#C81E1E] to-[#991B1B]" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Logo Banner */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-xs border border-red-200 bg-[#991B1B]">
            <img
              src={OFFICIAL_LOGO_SRC}
              alt="Comercial Fontenele"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-[#991B1B] font-['Montserrat',sans-serif]">
            Comercial Fontenele
          </span>
        </div>

        {/* Celebration Headline */}
        <h2 className="mt-2 text-3xl font-black text-[#111827] font-['Montserrat',sans-serif] tracking-tight">
          PARABÉNS!
        </h2>
        <p className="text-xs font-semibold text-[#64748B]">
          Você foi contemplado na Roleta de Prêmios!
        </p>

        {/* Prize Box with Product Photo & Name */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-b from-[#FEF2F2] to-white border-2 border-[#FCA5A5]/80 flex flex-col items-center shadow-inner">
          {/* Product Photo: Big prominent picture */}
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-md border-2 border-white bg-white flex items-center justify-center p-1 mb-3">
            {winner.imageUrl ? (
              <img
                src={winner.imageUrl}
                alt={winner.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center scale-150">
                <ProductThumbnail type={winner.iconType} />
              </div>
            )}
            <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 rounded-full p-1 border border-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <span className="text-[11px] font-black uppercase tracking-wider text-[#C81E1E] flex items-center gap-1.5 mb-1 font-['Montserrat',sans-serif]">
            <Gift className="w-3.5 h-3.5" /> Brinde Sorteado
          </span>

          {/* Nome do Brinde */}
          <div className="text-2xl font-black text-[#991B1B] font-['Montserrat',sans-serif] leading-tight text-center">
            {winner.name}
          </div>

          <div className="text-xs font-medium text-slate-500 mt-1">
            {winner.category} • SKU: {winner.sku}
          </div>

          <div className="mt-3 pt-2 border-t border-red-100/80 w-full flex items-center justify-center text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pronto para retirada no balcão
            </span>
          </div>
        </div>

        {/* QR Code: Foto do Campeão para postar no Instagram */}
        <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-red-50/70 border border-red-200/80 text-left">
          {selfieQr && (
            <img src={selfieQr} alt="QR Code Foto do Campeão" className="w-24 h-24 rounded-lg bg-white p-1 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#991B1B]">
              📸 Tire sua foto de campeão!
            </div>
            <div className="text-[11px] text-slate-600 leading-snug mt-0.5">
              Aponte a câmera, tire a selfie com a moldura da loja e poste nos Stories marcando{' '}
              <strong className="text-[#C81E1E]">{INSTAGRAM_HANDLE}</strong>
            </div>
          </div>
        </div>

        {/* Action Button: Strictly "Confirmar Entrega" */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onConfirmDelivery();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-[#C81E1E] hover:bg-[#991B1B] active:scale-[0.99] text-white font-black text-lg font-['Montserrat',sans-serif] uppercase tracking-wider shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            Confirmar Entrega
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#64748B] hover:text-[#111827] py-1 cursor-pointer transition-colors"
          >
            Fechar sem baixar estoque
          </button>
        </div>
      </div>
    </div>
  );
};
