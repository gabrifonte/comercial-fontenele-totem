/**
 * Links usados na tela de QR Codes que libera a roleta.
 * Para trocar um link, altere aqui, gere de novo o site (`npm run deploy:web`) e o app (`npm run electron:build`).
 */

// QR do Google: gerado automaticamente a partir deste link.
// Dica: para levar o cliente direto à tela de avaliação, use o link curto de avaliações
// do Perfil da Empresa no Google (Perfil da Empresa > "Pedir avaliações").
export const GOOGLE_REVIEW_URL = 'https://g.page/r/Ceft4jhGe-JzEAE/review';

// QR do Instagram: versão quadrada (1024x1024) para alinhamento simétrico com o Google.
export const INSTAGRAM_QR_IMAGE = 'assets/qr-instagram-square.png';
export const INSTAGRAM_HANDLE = '@_comercial_fontenele';

// Tempo (em segundos) até o botão "Já fiz" ser liberado, para dar tempo de ler o QR Code.
export const UNLOCK_DELAY_SECONDS = 8;

// WhatsApp oficial da loja (formato internacional, sem símbolos) usado no QR do prêmio.
export const WHATSAPP_NUMBER = '5511951761372';
export const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/_comercial_fontenele/';
