/**
 * QR Code Menu Service
 * Gera códigos QR para acessar o menu online
 */
import { logger } from './logger';

export interface QRCodeConfig {
  id: string;
  restaurantName: string;
  baseUrl: string; // ex: https://seu-dominio.com
  menuPath: string; // ex: /menu/public
  enabled: boolean;
  createdAt: Date;
  lastScanned?: Date;
  scanCount: number;
}

export interface MenuAccessLog {
  id: string;
  accessType: 'PUBLIC_MENU' | 'TABLE_MENU'; // Menu público vs menu de mesa específica
  timestamp: Date;
  userAgent: string;
  ipAddress?: string;
  tableId?: number;
}

/**
 * Gera URL para acessar o menu publicamente
 * Pode ser com ou sem table ID para pedidos
 */
const normalizeMenuBase = (baseUrl: string) => {
  const trimmed = baseUrl.trim();
  if (!trimmed) return { base: '', menuBase: '' };
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const [base] = withProtocol.split('#');
  const cleanBase = base.replace(/\/$/, '');
  return { base: cleanBase, menuBase: `${cleanBase}/#` };
};

export function generateMenuUrl(
  baseUrl: string,
  tableId?: number,
  sessionId?: string,
  version?: string
): string {
  const { menuBase } = normalizeMenuBase(baseUrl);
  const versionParam = version ? `v=${version}` : '';
  const sessionParam = sessionId ? `session=${sessionId}` : '';
  const params = [sessionParam, versionParam].filter(Boolean).join('&');
  const queryString = params ? `?${params}` : '';
  const path = tableId ? `/menu/${tableId}` : '/menu/public';
  return `${menuBase}${path}${queryString}`;
}

/**
 * Gera dados para criar QR code usando uma lib como qrcode.react ou qr-code-styling
 * Retorna string em formato que pode ser usado com bibliotecas de QR code
 */
export function generateQRCodeData(url: string): string {
  // Função auxiliar que será usada com library como:
  // import QRCode from 'qrcode.react';
  // <QRCode value={generateQRCodeData(url)} />
  return url;
}

/**
 * Gera um ID único para sessão de acesso ao menu
 * Usado para rastrear origem de pedidos
 */
export function generateMenuSessionId(): string {
  return `menu_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Valida se a URL do restaurante é válida
 */
export function validateRestaurantUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cria um link shareable para o menu
 * Pode ser usado em WhatsApp, Telegram, SMS, etc.
 */
export function generateShareableMenuLink(
  restaurantName: string,
  menuUrl: string,
  platform: 'whatsapp' | 'telegram' | 'sms' | 'facebook' | 'copy'
): string {
  const message = `Olá! 👋 Veja o menu do ${restaurantName} online: ${menuUrl}`;

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    case 'telegram':
      return `https://t.me/share/url?url=${encodeURIComponent(menuUrl)}&text=${encodeURIComponent(`Menu do ${restaurantName}`)}`;
    
    case 'sms':
      return `sms:?body=${encodeURIComponent(message)}`;
    
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(menuUrl)}`;
    
    case 'copy':
    default:
      return menuUrl;
  }
}

/**
 * Valida se uma string é uma URL de imagem válida para o menu
 */
export const isValidImageUrl = (src?: string): boolean => {
  if (!src || typeof src !== 'string') return false;
  const s = src.trim();
  if (!s || s === '/' || s === 'null' || s === 'undefined' || s === 'none') return false;
  
  // Base64 images are valid
  if (s.startsWith('data:image/')) return true;
  
  // Storage services (Cloudinary, ImgBB, etc.)
  if (
    s.includes('cloudinary.com') || 
    s.includes('imgbb.com') ||
    s.includes('images.unsplash.com') ||
    s.includes('img.clerk.com')
  ) return true;

  // Generic URL check
  if (s.match(/^https?:\/\//i)) {
    // Check if it looks like an image URL (common extensions)
    const urlWithoutQuery = s.split('?')[0].toLowerCase();
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/.test(urlWithoutQuery);
    
    // If it has an extension, it's definitely an image
    if (hasImageExtension) return true;
    
    // If it's a URL but no extension, it might be a dynamic image route. 
    // We'll allow it but it's less certain.
    return true; 
  }

  // Local paths
  if (s.startsWith('/') || s.startsWith('./') || s.startsWith('../')) {
    const pathWithoutQuery = s.split('?')[0].toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/.test(pathWithoutQuery);
  }
  
  return false;
};

/**
 * Gera um código curto para o menu (tipo encurtador de URL)
 * Pode ser usado em cartazes, cartões, etc.
 */
export function generateMenuShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Valida token de acesso ao menu (para segurança)
 */
export function generateMenuAccessToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Download QR code como imagem
 */
export async function downloadQRCodeImage(
  qrElement: HTMLDivElement,
  filename: string = 'menu-qr-code.png'
): Promise<void> {
  try {
    const svg = qrElement.querySelector('svg') as SVGSVGElement;
    if (!svg) throw new Error('QR code SVG not found');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = filename;
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('Erro ao descarregar QR code', { error: error.message }, 'QR_MENU');
    throw error;
  }
}

/**
 * Cria um PDF com o QR code
 * Requer biblioteca como jsPDF
 */
export async function generateQRCodePDF(
  _qrCodeUrl: string,
  _restaurantName: string
): Promise<Blob> {
  // Implementação com jsPDF
  // import jsPDF from 'jspdf';
  // const doc = new jsPDF();
  // doc.text(restaurantName, 10, 10);
  // doc.addImage(qrCodeUrl, 'PNG', 10, 20, 100, 100);
  // return doc.output('blob');

  return new Blob();
}

export interface MarketingQRConfig {
  campaignName: string;
  source: 'whatsapp' | 'instagram' | 'facebook' | 'email';
  discountCode?: string;
  expiresAt?: Date;
}

/**
 * Marketing QR Service
 * Gera URLs otimizadas para marketing digital com rastreio de origem.
 */
export function generateMarketingUrl(
  baseUrl: string,
  config: MarketingQRConfig
): string {
  const { menuBase } = normalizeMenuBase(baseUrl);
  const params = new URLSearchParams({
    utm_source: config.source,
    utm_campaign: config.campaignName,
  });

  if (config.discountCode) params.append('promo', config.discountCode);
  if (config.expiresAt) params.append('exp', config.expiresAt.getTime().toString());

  return `${menuBase}/menu/public?${params.toString()}`;
}

/**
 * Automates the distribution of digital marketing links
 */
export async function distributeMarketingLink(
  restaurantName: string,
  url: string,
  platform: 'whatsapp' | 'facebook'
) {
  const message = `🔥 Novidade no ${restaurantName}! 🔥\n\nConfira nosso menu atualizado e faça seu pedido online com facilidade:\n👉 ${url}\n\n#TascaDoVereda #Gastronomia #MenuDigital`;
  
  const shareUrl = platform === 'whatsapp' 
    ? `https://wa.me/?text=${encodeURIComponent(message)}`
    : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
  
  if (typeof window !== 'undefined') {
    window.open(shareUrl, '_blank');
  }
  
  logger.audit('MARKETING_DISTRIBUTION', { platform, url });
}

export default {
  generateMenuUrl,
  generateQRCodeData,
  generateMenuSessionId,
  validateRestaurantUrl,
  generateShareableMenuLink,
  generateMenuShortCode,
  generateMenuAccessToken,
  downloadQRCodeImage,
  generateQRCodePDF,
  generateMarketingUrl,
  distributeMarketingLink
};
