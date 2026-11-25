/**
 * Configurações do Modo de Descanso (Attract Mode) e Marketing da Comercial Fontenele
 */

export interface MarketingConfig {
  enabled: boolean;
  idleMinutes: number;           // Tempo de inatividade em minutos (1, 2, 3, 5, etc.)
  showVideo: boolean;            // Tocar o vídeo promocional se disponível
  videoMuted: boolean;           // Vídeo mudo por padrão (evita poluição sonora)
  showRoletaBanners: boolean;    // Alternar com cards chamativos da Roleta de Prêmios
  bannerDurationSec: number;     // Duração de cada card de marketing (segundos)
  customHeadlines: string[];     // Frases rotativas na tela de descanso
}

export const STORAGE_KEY_MARKETING = 'comercial_fontenele_marketing_v1';

export const DEFAULT_MARKETING_CONFIG: MarketingConfig = {
  enabled: true,
  idleMinutes: 1, // 1 minuto de inatividade para entrar no modo descanso
  showVideo: true,
  videoMuted: true,
  showRoletaBanners: true,
  bannerDurationSec: 120, // 2 minutos mostrando a roleta antes de voltar para o vídeo da loja
  customHeadlines: [
    'Comprou no balcão? Você tem direito a girar a Roleta de Prêmios!',
    'Siga @_comercial_fontenele no Instagram ou avalie no Google para girar!',
    'Materiais de Construção, Elétrica, Hidráulica e Ferragens com o melhor preço!',
    'Pergunte ao nosso vendedor como ganhar o brinde exclusivo de hoje!',
  ],
};

export const getMarketingConfig = (): MarketingConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MARKETING);
    if (raw) {
      return { ...DEFAULT_MARKETING_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // Fallback
  }
  return DEFAULT_MARKETING_CONFIG;
};

export const saveMarketingConfig = (config: MarketingConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_MARKETING, JSON.stringify(config));
  } catch {
    // Ignore
  }
};
