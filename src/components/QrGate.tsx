import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Camera, Star, ScanLine, Unlock, Loader2 } from 'lucide-react';
import { soundManager } from '../utils/audio';
import {
  GOOGLE_REVIEW_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_QR_IMAGE,
  UNLOCK_DELAY_SECONDS,
} from '../config/links';

interface QrGateProps {
  /** Called when the customer says they did one of the two actions. */
  onUnlock: (method: 'instagram' | 'google') => void;
  /** Lets the manager reach the inventory screen from the gate. */
  onNavigateToInventory?: () => void;
}

/**
 * Screen shown before the wheel: the customer scans one of the QR codes
 * (follow on Instagram OR review on Google) to earn a spin.
 */
export const QrGate: React.FC<QrGateProps> = ({ onUnlock, onNavigateToInventory }) => {
  const [googleQr, setGoogleQr] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(UNLOCK_DELAY_SECONDS);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(GOOGLE_REVIEW_URL, {
      errorCorrectionLevel: 'M',
      margin: 4, // Matches the square padding of the Instagram QR Code
      width: 600,
      color: { dark: '#111827', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setGoogleQr(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const ready = secondsLeft <= 0;

  const handleUnlock = (method: 'instagram' | 'google') => {
    if (!ready) return;
    soundManager.playClick();
    onUnlock(method);
  };

  const buttonClass = (enabled: boolean) =>
    `w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wide transition-all flex items-center justify-center gap-2 font-['Montserrat',sans-serif] ${
      enabled
        ? 'bg-[#B91C1C] hover:bg-[#991B1B] active:scale-98 text-white shadow-lg shadow-red-700/30 cursor-pointer'
        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
    }`;

  const buttonContent = (label: string) =>
    ready ? (
      <>
        <Unlock className="w-5 h-5" />
        <span>{label}</span>
      </>
    ) : (
      <>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Libera em {secondsLeft}s...</span>
      </>
    );

  return (
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-6xl mx-auto w-full gap-5">
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight font-['Montserrat',sans-serif]">
          <span className="text-[#1E293B]">QUER GIRAR A </span>
          <span className="text-[#C81E1E]">ROLETA?</span>
        </h1>
        <p className="mt-2 text-sm sm:text-lg font-semibold text-[#475569] flex items-center justify-center gap-2 flex-wrap">
          <ScanLine className="w-5 h-5 text-[#C81E1E]" />
          Aponte a câmera do celular para <strong className="text-slate-900">um dos QR Codes</strong> e ganhe o direito de girar!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl items-stretch">
        {/* Instagram */}
        <section className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-5 sm:p-7 flex flex-col justify-between items-center gap-4">
          <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-black text-[#1E293B] font-['Montserrat',sans-serif] text-center min-h-[36px]">
            <Camera className="w-6 h-6 text-pink-600 shrink-0" />
            <span>Siga a gente no Instagram</span>
          </div>

          <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl bg-white border border-slate-200/90 shadow-inner p-3 sm:p-4 flex items-center justify-center overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}${INSTAGRAM_QR_IMAGE}`}
              alt={`QR Code do Instagram ${INSTAGRAM_HANDLE}`}
              className="w-full h-full object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() => handleUnlock('instagram')}
            disabled={!ready}
            className={buttonClass(ready)}
          >
            {buttonContent('Já segui! Liberar roleta')}
          </button>
        </section>

        {/* Google */}
        <section className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-5 sm:p-7 flex flex-col justify-between items-center gap-4">
          <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-black text-[#1E293B] font-['Montserrat',sans-serif] text-center min-h-[36px]">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400 shrink-0" />
            <span>Avalie a gente no Google</span>
          </div>

          <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl bg-white border border-slate-200/90 shadow-inner p-3 sm:p-4 flex items-center justify-center overflow-hidden">
            {googleQr ? (
              <img
                src={googleQr}
                alt="QR Code para avaliar a Comercial Fontenele no Google"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleUnlock('google')}
            disabled={!ready}
            className={buttonClass(ready)}
          >
            {buttonContent('Já avaliei! Liberar roleta')}
          </button>
        </section>
      </div>

      <p className="text-xs sm:text-sm font-semibold text-[#64748B] text-center">
        Basta fazer <strong>uma</strong> das duas opções. Depois de escanear, toque no botão para liberar a sua jogada.
      </p>
      {onNavigateToInventory && (
        <button
          type="button"
          onClick={onNavigateToInventory}
          className="fixed bottom-2 right-3 text-[11px] font-semibold text-slate-400 hover:text-slate-700 underline"
        >
          Gerenciar estoque
        </button>
      )}
    </main>
  );
};
