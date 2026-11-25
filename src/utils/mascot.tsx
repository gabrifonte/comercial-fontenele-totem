import React from 'react';

// BASE_URL ('./') mantém os caminhos relativos, necessário para abrir via file:// no app desktop (Electron)
export const OFFICIAL_LOGO_SRC = `${import.meta.env.BASE_URL}assets/logo-fontenele.png`;
export const MASCOT_TRANSPARENT_SRC = `${import.meta.env.BASE_URL}assets/aistudio/Gemini_Generated_Image_qrgc98qrgc98qrgc-removebg-preview_31cbffed.png`;

interface MascotProps {
  className?: string;
  size?: number;
  badge?: boolean;
}

/**
 * Comercial Fontenele official mascot & logo component
 * using the official logo image provided by the client.
 */
export const FonteneleMascot: React.FC<MascotProps> = ({
  className = '',
  size = 48,
  badge = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${
        badge ? 'rounded-xl shadow-sm border border-red-200 bg-[#991B1B]' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title="Comercial Fontenele"
    >
      <img
        src={OFFICIAL_LOGO_SRC}
        alt="Comercial Fontenele"
        className="w-full h-full object-cover object-center"
        loading="eager"
      />
    </div>
  );
};

export const BrandLogoHeader: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm border border-red-200 bg-[#991B1B] shrink-0">
        <img
          src={OFFICIAL_LOGO_SRC}
          alt="Comercial Fontenele Logo"
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="font-bold text-lg tracking-tight text-[#111827] font-['Montserrat',sans-serif]">
            Comercial
          </span>
          <span className="font-black text-xl tracking-tight text-[#C81E1E] font-['Montserrat',sans-serif] uppercase">
            FONTENELE
          </span>
        </div>
        <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase mt-0.5 hidden sm:inline-block font-['Inter',sans-serif]">
          Materiais de Construção • Elétrica • Ferragens • Hidráulica
        </span>
      </div>
    </div>
  );
};
