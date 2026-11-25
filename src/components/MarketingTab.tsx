import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Upload,
  Trash2,
  Play,
  Sparkles,
  Bot,
  Plus,
  Clock,
  Volume2,
  VolumeX,
  Tv,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Lightbulb,
  FileVideo,
} from 'lucide-react';
import {
  savePromoVideo,
  getPromoVideoBlob,
  getPromoVideoMeta,
  deletePromoVideo,
  VideoMeta,
} from '../utils/videoStorage';
import {
  MarketingConfig,
  getMarketingConfig,
  saveMarketingConfig,
} from '../config/marketing';
import { soundManager } from '../utils/audio';

interface MarketingTabProps {
  onTestScreensaver: () => void;
}

// Ideias pré-geradas pela IA especializadas no ramo da Comercial Fontenele
const AI_SUGGESTIONS_BANK = [
  {
    category: 'Frase de Balcão',
    text: 'Reforma em casa? Aqui você encontra tudo em materiais de construção e ferramentas!',
  },
  {
    category: 'Frase de Balcão',
    text: 'Qualidade que sua obra precisa com a economia que seu bolso merece!',
  },
  {
    category: 'Frase de Balcão',
    text: 'Sua compra no balcão vale prêmios! Gire a roleta e saia com brindes.',
  },
  {
    category: 'Promoção de Construção',
    text: 'Festival da Elétrica e Iluminação: fios, lâmpadas e disjuntores com preço de fábrica!',
  },
  {
    category: 'Promoção de Construção',
    text: 'Quinzena Hidráulica: tubos, conexões e registros com descontos imperdíveis.',
  },
  {
    category: 'Roteiro de Vídeo para TV',
    text: 'Dica do Especialista: 3 erros comuns ao escolher impermeabilizante para sua laje.',
  },
  {
    category: 'Roteiro de Vídeo para TV',
    text: 'Tour pela Loja: conheça nossa linha completa de ferramentas profissionais.',
  },
];

export const MarketingTab: React.FC<MarketingTabProps> = ({ onTestScreensaver }) => {
  const [config, setConfig] = useState<MarketingConfig>(getMarketingConfig);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newHeadline, setNewHeadline] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [currentAiIdeas, setCurrentAiIdeas] = useState(AI_SUGGESTIONS_BANK.slice(0, 4));

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carrega vídeo existente
  useEffect(() => {
    let activeUrl: string | null = null;
    getPromoVideoMeta().then((meta) => setVideoMeta(meta));
    getPromoVideoBlob().then((blob) => {
      if (blob) {
        activeUrl = URL.createObjectURL(blob);
        setVideoUrl(activeUrl);
      }
    });

    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, []);

  const handleUpdateConfig = (patch: Partial<MarketingConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveMarketingConfig(next);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundManager.playClick();
    setUploading(true);
    try {
      const meta = await savePromoVideo(file);
      setVideoMeta(meta);

      const blob = await getPromoVideoBlob();
      if (blob) {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      alert('Erro ao carregar vídeo: ' + String(err));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm('Deseja realmente remover o vídeo promocional?')) return;
    soundManager.playClick();
    await deletePromoVideo();
    setVideoMeta(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
  };

  const handleAddHeadline = (textToAdd?: string) => {
    const text = (textToAdd || newHeadline).trim();
    if (!text) return;
    if (config.customHeadlines.includes(text)) return;

    soundManager.playClick();
    const next = [...config.customHeadlines, text];
    handleUpdateConfig({ customHeadlines: next });
    if (!textToAdd) setNewHeadline('');
  };

  const handleRemoveHeadline = (index: number) => {
    soundManager.playClick();
    const next = config.customHeadlines.filter((_, i) => i !== index);
    handleUpdateConfig({ customHeadlines: next });
  };

  const handleGenerateAiIdeas = () => {
    soundManager.playClick();
    setAiGenerating(true);
    setTimeout(() => {
      // Embaralha e seleciona 4 ideias inspiradoras da IA
      const shuffled = [...AI_SUGGESTIONS_BANK].sort(() => 0.5 - Math.random());
      setCurrentAiIdeas(shuffled.slice(0, 4));
      setAiGenerating(false);
    }, 600);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Top Banner de Status */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#C81E1E] flex items-center justify-center shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[#111827] font-['Montserrat',sans-serif]">
                Modo de Descanso & Marketing na TV
              </h2>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Salvo!
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Transforme a tela ociosa do totem em um canal de propaganda interativo para produtos e roleta.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            onTestScreensaver();
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C81E1E] hover:bg-[#991B1B] text-white font-black text-xs sm:text-sm uppercase tracking-wide font-['Montserrat',sans-serif] shadow-md shadow-red-700/25 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Testar Modo Descanso Agora</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Vídeo da Loja (13 a 14 min) */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-base sm:text-lg text-[#111827] font-['Montserrat',sans-serif]">
                <FileVideo className="w-5 h-5 text-[#C81E1E]" />
                <h3>Vídeo Promocional da TV (MP4)</h3>
              </div>
              {videoMeta && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {formatSize(videoMeta.size)}
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Envie o vídeo institucional/produtos de 10 a 15 minutos do seu computador. Ele fica salvo no navegador do totem para rodar em alta resolução sem travar.
            </p>
          </div>

          {/* Área de Preview ou Upload */}
          <div className="w-full aspect-video rounded-2xl bg-slate-900 border-2 border-dashed border-slate-300 overflow-hidden relative flex flex-col items-center justify-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#C81E1E]" />
                <span className="text-xs font-bold">Salvando vídeo no totem...</span>
              </div>
            ) : videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-center">
                <Video className="w-10 h-10 text-slate-500" />
                <span className="text-xs font-bold text-slate-300">
                  Nenhum vídeo carregado no momento.
                </span>
                <span className="text-[11px] text-slate-500 max-w-xs">
                  Quando não há vídeo, o modo de descanso exibe uma animação elegante da Roleta de Prêmios.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoUpload}
              className="hidden"
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#111827] font-bold text-xs sm:text-sm font-['Montserrat',sans-serif] transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
            >
              <Upload className="w-4 h-4 text-[#C81E1E]" />
              <span>{videoMeta ? 'Trocar Arquivo de Vídeo' : 'Selecionar Vídeo do Computador'}</span>
            </button>

            {videoMeta && (
              <button
                type="button"
                onClick={handleDeleteVideo}
                className="py-3 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer border border-red-200"
                title="Excluir vídeo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* Bloco 2: Configurações de Tempo e Exibição */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-5">
          <div className="flex items-center gap-2 font-black text-base sm:text-lg text-[#111827] font-['Montserrat',sans-serif]">
            <Clock className="w-5 h-5 text-[#C81E1E]" />
            <h3>Comportamento do Modo Descanso</h3>
          </div>

          <div className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
            {/* Ativar/Desativar */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <span className="font-bold text-sm text-[#111827] block">
                  Modo Descanso Automático
                </span>
                <span className="text-slate-500 text-xs">
                  Entra no modo TV quando o totem não recebe toques.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleUpdateConfig({ enabled: e.target.checked })}
                className="w-5 h-5 text-[#C81E1E] rounded focus:ring-[#C81E1E] cursor-pointer"
              />
            </label>

            {/* Tempo de Inatividade */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-sm text-[#111827]">
                Tempo de Espera até Iniciar
              </span>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {[1, 2, 3, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleUpdateConfig({ idleMinutes: mins })}
                    className={`py-2 rounded-lg font-bold text-xs transition-all ${
                      config.idleMinutes === mins
                        ? 'bg-[#C81E1E] text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Alternar Vídeo com Roleta */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <span className="font-bold text-sm text-[#111827] block">
                  Alternar Vídeo com Propaganda da Roleta
                </span>
                <span className="text-slate-500 text-xs">
                  Rola o vídeo da loja até o fim e depois exibe a Roleta.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.showRoletaBanners}
                onChange={(e) => handleUpdateConfig({ showRoletaBanners: e.target.checked })}
                className="w-5 h-5 text-[#C81E1E] rounded focus:ring-[#C81E1E] cursor-pointer"
              />
            </label>

            {/* Tempo exibindo a Roleta de Prêmios */}
            {config.showRoletaBanners && (
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-sm text-[#111827]">
                  Tempo Exibindo a Roleta de Prêmios
                </span>
                <span className="text-slate-500 text-xs">
                  Tempo que o slide da roleta fica na tela antes de voltar para o vídeo da loja.
                </span>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[
                    { label: '1 min', sec: 60 },
                    { label: '2 min', sec: 120 },
                    { label: '3 min', sec: 180 },
                    { label: '5 min', sec: 300 },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => handleUpdateConfig({ bannerDurationSec: item.sec })}
                      className={`py-2 rounded-lg font-bold text-xs transition-all ${
                        (config.bannerDurationSec || 120) === item.sec
                          ? 'bg-[#C81E1E] text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Som do Vídeo no Totem */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <span className="font-bold text-sm text-[#111827] block flex items-center gap-1.5">
                  {config.videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                  Iniciar Vídeo no Mudo
                </span>
                <span className="text-slate-500 text-xs">
                  Recomendado para não atrapalhar os atendimentos no balcão.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.videoMuted}
                onChange={(e) => handleUpdateConfig({ videoMuted: e.target.checked })}
                className="w-5 h-5 text-[#C81E1E] rounded focus:ring-[#C81E1E] cursor-pointer"
              />
            </label>
          </div>
        </section>
      </div>

      {/* Bloco 3: Assistente de IA de Marketing da Comercial Fontenele */}
      <section className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#111827] font-['Montserrat',sans-serif]">
                Assistente de IA: Ideias de Marketing da Loja
              </h3>
              <p className="text-xs text-slate-500">
                Sugestões inteligentes para materiais de construção, ferramentas, elétrica e promoções.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={aiGenerating}
            onClick={handleGenerateAiIdeas}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-['Montserrat',sans-serif] transition-all cursor-pointer self-start sm:self-auto border border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-spin text-[#C81E1E]' : ''}`} />
            <span>Gerar Novas Ideias com IA</span>
          </button>
        </div>

        {/* Cards de Ideias da IA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {currentAiIdeas.map((idea, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200 flex flex-col justify-between gap-3 hover:border-red-200 transition-colors"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C81E1E] bg-red-50 px-2 py-0.5 rounded-md border border-red-100 inline-block mb-1.5 font-['Montserrat',sans-serif]">
                  <Lightbulb className="w-3 h-3 inline mr-1" />
                  {idea.category}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                  "{idea.text}"
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddHeadline(idea.text)}
                className="self-end flex items-center gap-1 text-[11px] font-bold text-[#C81E1E] hover:text-[#991B1B] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Usar na Tela de Descanso</span>
              </button>
            </div>
          ))}
        </div>

        {/* Gerenciador de Frases Rotativas da Tela */}
        <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 font-['Montserrat',sans-serif]">
              Frases Ativas na Tela de Descanso ({config.customHeadlines.length})
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite uma nova frase para passar na tela de descanso..."
              value={newHeadline}
              onChange={(e) => setNewHeadline(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHeadline()}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/40"
            />
            <button
              type="button"
              onClick={() => handleAddHeadline()}
              className="px-4 py-2.5 rounded-xl bg-[#C81E1E] hover:bg-[#991B1B] text-white font-bold text-xs sm:text-sm font-['Montserrat',sans-serif] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {config.customHeadlines.map((headline, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
              >
                <span className="flex-1">
                  <strong className="text-slate-400 mr-2 font-mono">#{idx + 1}</strong>
                  {headline}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveHeadline(idx)}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                  title="Remover frase"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
