import React from 'react';

export const ProductThumbnail: React.FC<{
  type?: string;
  imageUrl?: string;
  isOutOfStock?: boolean;
}> = ({ type, imageUrl, isOutOfStock }) => {
  const baseClasses = `w-10 h-10 rounded-lg flex items-center justify-center p-1 border shadow-xs shrink-0 overflow-hidden ${
    isOutOfStock ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-slate-50 border-slate-200'
  }`;

  if (imageUrl) {
    return (
      <div className={baseClasses}>
        <img
          src={imageUrl}
          alt="Foto do Brinde"
          className="w-full h-full object-cover rounded-md"
        />
      </div>
    );
  }

  switch (type) {
    case 'trena':
      return (
        <div className={baseClasses}>
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
            <rect x="6" y="8" width="22" height="20" rx="4" fill="#FBBF24" stroke="#1E293B" strokeWidth="2" />
            <circle cx="17" cy="18" r="5" fill="#1E293B" />
            <rect x="26" y="15" width="6" height="6" fill="#E2E8F0" stroke="#1E293B" strokeWidth="1.5" />
            <line x1="28" y1="18" x2="31" y2="18" stroke="#EF4444" strokeWidth="1.5" />
          </svg>
        </div>
      );
    case 'chaves':
      return (
        <div className={baseClasses}>
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
            <rect x="4" y="6" width="28" height="24" rx="3" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="10" y2="26" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="8" x2="16" y2="28" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="22" y1="10" x2="22" y2="26" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="26" y1="12" x2="26" y2="24" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'brocas':
      return (
        <div className={baseClasses}>
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
            <rect x="6" y="6" width="24" height="24" rx="3" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
            <line x1="12" y1="10" x2="12" y2="26" stroke="#94A3B8" strokeWidth="2" strokeDasharray="2 1" />
            <line x1="18" y1="8" x2="18" y2="28" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="3 1" />
            <line x1="24" y1="12" x2="24" y2="24" stroke="#94A3B8" strokeWidth="2" strokeDasharray="2 1" />
          </svg>
        </div>
      );
    case 'vale':
      return (
        <div className={baseClasses}>
          <div className="w-full h-full rounded bg-slate-900 border border-amber-400 flex flex-col items-center justify-center text-[9px] font-black text-amber-300 font-mono">
            <span>VALE</span>
            <span className="text-[10px] text-white">R$50</span>
          </div>
        </div>
      );
    case 'balde':
      return (
        <div className={baseClasses}>
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
            <path d="M8 12 L11 28 C11 30 14 31 18 31 C22 31 25 30 25 28 L28 12 Z" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
            <ellipse cx="18" cy="12" rx="10" ry="3" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
            <path d="M9 12 C9 4 27 4 27 12" stroke="#334155" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      );
    case 'bone':
      return (
        <div className={baseClasses}>
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
            <path d="M10 20 C10 13 14 9 22 9 C27 9 30 13 30 20 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
            <path d="M6 21 C12 21 28 20 32 23 C28 25 18 26 6 23 Z" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1" />
            <circle cx="21" cy="9" r="1.5" fill="#FFFFFF" />
          </svg>
        </div>
      );
    case 'chaveiro':
      return (
        <div className={baseClasses}>
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
            <circle cx="12" cy="14" r="5" stroke="#64748B" strokeWidth="1.5" fill="none" />
            <rect x="15" y="16" width="15" height="13" rx="2" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
            <circle cx="22" cy="22" r="3" fill="#FFFFFF" />
          </svg>
        </div>
      );
    default:
      return (
        <div className={baseClasses}>
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8 text-slate-400">
            <rect x="6" y="8" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
            <circle cx="18" cy="18" r="4" fill="currentColor" />
          </svg>
        </div>
      );
  }
};
