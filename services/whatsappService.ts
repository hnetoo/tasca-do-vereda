import { Dish } from '../types';
import { logger } from './logger';

export interface WhatsAppMessage {
  id: string;
  from: string; // Phone number
  senderName: string;
  body: string;
  timestamp: number;
}

export interface ParsedOrder {
  items: Array<{ dish: Dish; quantity: number; notes?: string }>;
  confidence: number; // 0-1
  originalText: string;
}

/**
 * Parses a natural language text to extract order items based on the menu.
 * Example: "Quero 2 Hamburgueres da casa e uma coca cola zero"
 */
export const parseWhatsAppOrder = (text: string, menu: Dish[]): ParsedOrder => {
  try {
    const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const foundItems: Array<{ dish: Dish; quantity: number; notes?: string; index: number }> = [];

  // Sort menu by name length (descending) to match "Hamburguer da Casa" before "Hamburguer"
  const sortedMenu = [...menu].sort((a, b) => b.name.length - a.name.length);

  for (const dish of sortedMenu) {
    const dishName = dish.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Simple regex to find the dish name
    // We look for the dish name, optionally preceded by a number
    // Regex explanation:
    // (?:(\d+)\s*(?:unidades?|x)?\s*)? -> Optional capturing group for quantity (e.g. "2 ", "2x ", "2 unidades ")
    // ${dishName} -> The dish name
    // (?:s)? -> Optional plural 's' (very basic)
    const regex = new RegExp(`(?:(\\d+)\\s*(?:unidades?|x|de)?\\s*)?${dishName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s)?`, 'g');
    
    let match;
    while ((match = regex.exec(normalizedText)) !== null) {
      // Check if this part of string was already claimed by a longer match
      const isOverlapping = foundItems.some(item => 
        (match!.index >= item.index && match!.index < item.index + item.dish.name.length) ||
        (item.index >= match!.index && item.index < match!.index + match![0].length)
      );

      if (!isOverlapping) {
        const quantity = match[1] ? parseInt(match[1]) : 1;
        foundItems.push({
          dish,
          quantity,
          index: match.index
        });
      }
    }
  }

  // Calculate confidence based on how much of the text was matched (simplified)
  // In a real NLP system this would be more complex
  const totalMatchedLength = foundItems.reduce((acc, item) => acc + item.dish.name.length, 0);
  const confidence = Math.min(1, totalMatchedLength / normalizedText.length + 0.2); // Base confidence

  const result = {
    items: foundItems.map(i => ({ dish: i.dish, quantity: i.quantity })),
    confidence,
    originalText: text
  };

  logger.info('Pedido WhatsApp processado', { 
    itemCount: result.items.length, 
    confidence: result.confidence 
  }, 'WHATSAPP');

  return result;
} catch (e: unknown) {
  const error = e as Error;
  logger.error('Erro ao processar pedido WhatsApp', { error: error.message, text }, 'WHATSAPP');
  return {
    items: [],
    confidence: 0,
    originalText: text
  };
}
};

/**
 * Validates a webhook signature (mock implementation)
 */
export const validateWebhookSignature = (_payload: unknown, _signature: string, _secret: string) => {
  // In production, use HMAC-SHA256
  return true; 
};
