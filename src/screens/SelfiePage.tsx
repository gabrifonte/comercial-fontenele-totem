import React, { useEffect, useRef, useState } from 'react';
import { OFFICIAL_LOGO_SRC } from '../utils/mascot';
import { INSTAGRAM_HANDLE } from '../config/links';

/**
 * Página aberta no celular do cliente ao ler o QR Code do prêmio (?selfie=1&p=NomeDoBrinde).
 * Abre a câmera frontal com uma moldura "Ganhei na Comercial Fontenele", tira a foto
 * e abre o menu de compartilhar do celular (Instagram Stories etc.).
 */
const W = 1080;
const H = 1920;

export const SelfiePage: React.FC = () => {
  const prize = new URLSearchParams(window.location.search).get('p') || 'um brinde';
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOk, setCameraOk] = useState(true);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [photo, setPhoto] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  const startCamera = async (mode: 'user' | 'environment' = facing) => {
    setPhoto(null);
    setBlob(null);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      // Formato retrato 9:16 evita que o navegador "estique" a imagem e cause zoom excessivo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, aspectRatio: { ideal: 9 / 16 }, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      // Se a câmera suportar zoom, usa o mínimo (campo de visão mais aberto)
      try {
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.() as any;
        if (caps?.zoom) await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min } as any] });
      } catch {
        /* sem suporte a zoom */
      }
      setFacing(mode);
      setCameraOk(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraOk(false);
    }
  };

  const flipCamera = () => startCamera(facing === 'user' ? 'environment' : 'user');

  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });

  const compose = async (source: CanvasImageSource, sw: number, sh: number, mirror: boolean) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    // cover-fit da foto no formato Stories 9:16
    const scale = Math.max(W / sw, H / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.save();
    if (mirror) {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();

    // faixa superior vermelha com logo
    const top = ctx.createLinearGradient(0, 0, 0, 300);
    top.addColorStop(0, 'rgba(153,27,27,0.95)');
    top.addColorStop(1, 'rgba(153,27,27,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 300);
    try {
      const logo = await loadImg(OFFICIAL_LOGO_SRC);
      ctx.drawImage(logo, 60, 60, 130, 130);
    } catch {
      /* sem logo */
    }
    ctx.fillStyle = '#fff';
    ctx.font = '900 54px Montserrat, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('COMERCIAL FONTENELE', 215, 125);

    // faixa inferior com texto do prêmio
    const bot = ctx.createLinearGradient(0, H - 700, 0, H);
    bot.addColorStop(0, 'rgba(153,27,27,0)');
    bot.addColorStop(0.45, 'rgba(153,27,27,0.92)');
    bot.addColorStop(1, 'rgba(120,20,20,0.98)');
    ctx.fillStyle = bot;
    ctx.fillRect(0, H - 700, W, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FDE68A';
    ctx.font = '900 64px Montserrat, Arial, sans-serif';
    ctx.fillText('🎉 GANHEI NA ROLETA! 🎉', W / 2, H - 440);
    ctx.fillStyle = '#fff';
    ctx.font = '900 84px Montserrat, Arial, sans-serif';
    // quebra simples do nome do brinde em até 2 linhas
    const words = prize.split(' ');
    const lines: string[] = [''];
    words.forEach((w) => {
      const cur = lines[lines.length - 1];
      if (ctx.measureText(`${cur} ${w}`.trim()).width > W - 160 && lines.length < 2) lines.push(w);
      else lines[lines.length - 1] = `${cur} ${w}`.trim();
    });
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H - 330 + i * 95));
    ctx.fillStyle = '#FDE68A';
    ctx.font = '800 56px Montserrat, Arial, sans-serif';
    ctx.fillText(INSTAGRAM_HANDLE, W / 2, H - 100);

    return new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.92));
  };

  const finish = async (b: Blob) => {
    setBlob(b);
    setPhoto(URL.createObjectURL(b));
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const takePhoto = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    finish(await compose(v, v.videoWidth, v.videoHeight, facing === 'user'));
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const img = await loadImg(URL.createObjectURL(f));
    finish(await compose(img, img.width, img.height, false));
  };

  const share = async () => {
    if (!blob) return;
    const file = new File([blob], 'ganhei-comercial-fontenele.jpg', { type: 'image/jpeg' });
    const data = { files: [file], text: `Ganhei ${prize} na Comercial Fontenele! ${INSTAGRAM_HANDLE}` };
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        return;
      } catch {
        return; // cliente cancelou
      }
    }
    // Sem compartilhamento nativo: baixa a foto para postar manualmente
    const a = document.createElement('a');
    a.href = photo!;
    a.download = 'ganhei-comercial-fontenele.jpg';
    a.click();
  };

  const btn = 'w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wide active:scale-[0.98] transition';

  return (
    <div className="min-h-screen bg-[#7F1D1D] flex flex-col items-center justify-center p-4 text-center text-white font-['Montserrat',sans-serif]">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-black">📸 Foto do Campeão</h1>
        <p className="text-xs text-red-100 mb-3">Tire sua foto, poste nos Stories e marque {INSTAGRAM_HANDLE}</p>

        <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-2xl border-4 border-white/20">
          {photo ? (
            <img src={photo} alt="Sua foto" className="w-full h-full object-cover" />
          ) : cameraOk ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`} />
              <div className="absolute inset-x-0 top-0 h-1/6 bg-gradient-to-b from-[#991B1B] to-transparent flex items-start p-3 gap-2 text-left">
                <img src={OFFICIAL_LOGO_SRC} alt="" className="w-9 h-9 rounded-md" />
                <span className="text-xs font-black mt-2">COMERCIAL FONTENELE</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#991B1B] via-[#991B1B]/90 to-transparent flex flex-col items-center justify-end pb-4 px-3">
                <div className="text-amber-200 font-black text-sm">🎉 GANHEI NA ROLETA! 🎉</div>
                <div className="font-black text-lg leading-tight">{prize}</div>
                <div className="text-amber-200 font-extrabold text-xs mt-1">{INSTAGRAM_HANDLE}</div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 gap-3">
              <p className="text-sm">Não foi possível abrir a câmera. Você pode tirar a foto pelo botão abaixo.</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {photo ? (
            <>
              <button onClick={share} className={`${btn} bg-gradient-to-r from-pink-500 via-red-500 to-amber-400`}>
                Postar no Instagram
              </button>
              <button onClick={() => startCamera()} className={`${btn} bg-white/15`}>Tirar outra</button>
            </>
          ) : cameraOk ? (
            <>
              <button onClick={takePhoto} className={`${btn} bg-white text-[#991B1B]`}>Tirar foto</button>
              <button onClick={flipCamera} className={`${btn} bg-white/15 text-base`}>
                🔄 {facing === 'user' ? 'Usar câmera traseira' : 'Usar câmera frontal (selfie)'}
              </button>
            </>
          ) : (
            <button onClick={() => fileRef.current?.click()} className={`${btn} bg-white text-[#991B1B]`}>Abrir câmera</button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
};
