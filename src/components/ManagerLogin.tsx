import React, { useState } from 'react';
import { ArrowLeft, Loader2, Lock, LogIn, ShieldAlert, Sparkles, Tv } from 'lucide-react';
import * as cloud from '../lib/cloud';
import { OFFICIAL_LOGO_SRC } from '../utils/mascot';

interface ManagerLoginProps {
  /** Goes back to the (public) wheel screen. */
  onBack: () => void;
  /** Opens the 3D Mascot & Wheel Screensaver directly in Demo Mode */
  onOpenScreensaver?: () => void;
  /** Unlocks the demo wheel directly in Demo Mode */
  onUnlockDemoWheel?: () => void;
}

const friendlyError = (err: unknown): string => {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
};

/**
 * Login screen for the manager mode (stock control).
 * In Portfolio / Demo Mode (`cloud.demoMode`), the manager area and real database are 100% locked.
 */
export const ManagerLogin: React.FC<ManagerLoginProps> = ({
  onBack,
  onOpenScreensaver,
  onUnlockDemoWheel,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (cloud.demoMode) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-red-100 shadow-2xl p-6 sm:p-8 flex flex-col gap-5 text-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-200 bg-[#991B1B] shadow-md flex items-center justify-center">
              <img src={OFFICIAL_LOGO_SRC} alt="Comercial Fontenele" className="w-full h-full object-cover" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-[#C81E1E]" />
              Modo Visitante • Portfólio
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] font-['Montserrat',sans-serif] flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-[#C81E1E]" />
              Painel Gerencial Bloqueado
            </h1>
            <p className="text-sm text-[#475569] font-medium leading-relaxed">
              Você está visualizando a <strong>versão pública de demonstração</strong> (GitHub / LinkedIn) com brindes fictícios. O estoque real da loja, as chaves de API e o painel administrativo do Firebase estão <strong>100% bloqueados</strong> para visitantes externos.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-[#475569] space-y-1.5">
            <p className="font-extrabold text-[#1E293B] uppercase tracking-wide">
              O que você pode testar nesta Demo:
            </p>
            <p>✅ Girar a Roleta de Prêmios a 60 FPS com brindes fictícios</p>
            <p>✅ Ver o Mascote 3D interativo no Modo Descanso (pintura, hidráulica e IA)</p>
            <p>✅ Testar a câmera de Selfie do Ganhador com moldura oficial</p>
            <p>🔒 Painel do Gerente e Banco de Dados Real: <strong>Protegidos</strong></p>
          </div>

          <div className="flex flex-col gap-2.5">
            {onUnlockDemoWheel && (
              <button
                type="button"
                onClick={onUnlockDemoWheel}
                className="w-full py-3.5 rounded-2xl bg-[#C81E1E] hover:bg-[#991B1B] text-white font-black uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Testar Roleta com Brindes Fictícios
              </button>
            )}
            {onOpenScreensaver && (
              <button
                type="button"
                onClick={onOpenScreensaver}
                className="w-full py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-[#991B1B] font-black uppercase tracking-wide text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Tv className="w-4 h-4" />
                Ver Mascote 3D no Modo Descanso
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl text-[#64748B] hover:text-[#111827] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar à tela inicial
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await cloud.signInManager(email, password);
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Digite o e-mail do gerente acima para receber o link de nova senha.');
      return;
    }
    try {
      await cloud.sendManagerPasswordReset(email);
    } catch {
      // Never reveal whether the e-mail exists
    }
    setInfo('Se esse e-mail for do gerente, enviamos um link para criar uma nova senha.');
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 bg-[#F8FAFC]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 flex flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-red-200 bg-[#991B1B] shadow-sm">
            <img src={OFFICIAL_LOGO_SRC} alt="Comercial Fontenele" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-black text-[#1E293B] font-['Montserrat',sans-serif] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#C81E1E]" />
            Modo Gerente
          </h1>
          <p className="text-sm text-[#64748B] font-medium">Entre para controlar o estoque de brindes.</p>
        </div>

        <label className="flex flex-col gap-1 text-xs font-bold text-[#475569] uppercase tracking-wide">
          E-mail
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-3 py-3 rounded-xl border border-slate-300 text-base font-medium normal-case text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/40 focus:border-[#C81E1E]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-bold text-[#475569] uppercase tracking-wide">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-3 py-3 rounded-xl border border-slate-300 text-base font-medium normal-case text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/40 focus:border-[#C81E1E]"
          />
        </label>

        {error && <p className="text-sm font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {info && <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 text-white font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          Entrar
        </button>

        <div className="flex items-center justify-between text-xs font-semibold">
          <button
            type="button"
            onClick={onBack}
            className="text-[#64748B] hover:text-[#111827] flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar à roleta
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-[#C81E1E] hover:underline cursor-pointer"
          >
            Esqueci minha senha
          </button>
        </div>
      </form>
    </main>
  );
};
