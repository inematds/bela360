import { MessageReceived, ParsedMessage } from './whatsapp.types';

/**
 * Parse webhook message to internal format
 */
export function parseWebhookMessage(data: MessageReceived): ParsedMessage | null {
  try {
    const { key, pushName, message, messageTimestamp } = data;

    if (!key || !message) return null;

    // Extract phone number from remoteJid
    const phoneNumber = extractPhoneNumber(key.remoteJid);
    if (!phoneNumber) return null;

    // Extract text content
    let text = '';
    let mediaUrl: string | undefined;
    let mediaType: ParsedMessage['mediaType'];
    let buttonResponse: ParsedMessage['buttonResponse'];
    let listResponse: ParsedMessage['listResponse'];

    if (message.conversation) {
      text = message.conversation;
    } else if (message.extendedTextMessage?.text) {
      text = message.extendedTextMessage.text;
    } else if (message.imageMessage) {
      text = message.imageMessage.caption || '[Imagem]';
      mediaUrl = message.imageMessage.url;
      mediaType = 'image';
    } else if (message.audioMessage) {
      text = '[Áudio]';
      mediaUrl = message.audioMessage.url;
      mediaType = 'audio';
    } else if (message.videoMessage) {
      text = message.videoMessage.caption || '[Vídeo]';
      mediaUrl = message.videoMessage.url;
      mediaType = 'video';
    } else if (message.documentMessage) {
      text = `[Documento: ${message.documentMessage.fileName}]`;
      mediaUrl = message.documentMessage.url;
      mediaType = 'document';
    } else if (message.buttonsResponseMessage) {
      text = message.buttonsResponseMessage.selectedDisplayText;
      buttonResponse = {
        buttonId: message.buttonsResponseMessage.selectedButtonId,
        displayText: message.buttonsResponseMessage.selectedDisplayText,
      };
    } else if (message.listResponseMessage) {
      text = message.listResponseMessage.title;
      listResponse = {
        rowId: message.listResponseMessage.singleSelectReply.selectedRowId,
        title: message.listResponseMessage.title,
      };
    }

    return {
      messageId: key.id,
      remoteJid: key.remoteJid,
      phoneNumber,
      fromMe: key.fromMe,
      pushName: pushName || '',
      text,
      mediaUrl,
      mediaType,
      buttonResponse,
      listResponse,
      timestamp: new Date(messageTimestamp * 1000),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract phone number from WhatsApp JID
 */
export function extractPhoneNumber(remoteJid: string): string | null {
  if (!remoteJid) return null;

  // Remove @s.whatsapp.net or @g.us suffix
  const match = remoteJid.match(/^(\d+)@/);
  if (!match) return null;

  let phone = match[1];

  // Format Brazilian phone number
  if (phone.startsWith('55') && phone.length >= 12) {
    // Already has country code
    return phone;
  }

  return phone;
}

/**
 * Format phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('55') && cleaned.length === 13) {
    // Brazilian mobile: +55 (11) 99999-9999
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('55') && cleaned.length === 12) {
    // Brazilian landline: +55 (11) 9999-9999
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }

  return phone;
}

/**
 * Check if phone number is valid
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');

  // Must have 10-11 digits (without country code) or 12-13 (with country code)
  if (cleaned.length < 10 || cleaned.length > 13) {
    return false;
  }

  // If has country code, must be 55
  if (cleaned.length >= 12 && !cleaned.startsWith('55')) {
    return false;
  }

  return true;
}

/**
 * Normalize phone number to consistent format
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // Add Brazil country code if not present
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }

  // Add 9 digit if it's a mobile number without it (old format)
  if (cleaned.length === 12) {
    const ddd = cleaned.slice(2, 4);
    const number = cleaned.slice(4);

    // Check if it's a mobile number (starts with 9, 8, or 7 in some regions)
    if (['9', '8', '7'].includes(number[0]) && number.length === 8) {
      cleaned = `55${ddd}9${number}`;
    }
  }

  return cleaned;
}

/**
 * Generate WhatsApp JID from phone number
 */
export function phoneToJid(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return `${normalized}@s.whatsapp.net`;
}

/**
 * Check if message is from a group
 */
export function isGroupMessage(remoteJid: string): boolean {
  return remoteJid.endsWith('@g.us');
}

/**
 * Escape special characters for WhatsApp formatting
 */
export function escapeWhatsAppText(text: string): string {
  return text
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`');
}

/**
 * Format text with WhatsApp markdown
 */
export function formatWhatsAppText(text: string, style: 'bold' | 'italic' | 'strikethrough' | 'monospace'): string {
  switch (style) {
    case 'bold':
      return `*${text}*`;
    case 'italic':
      return `_${text}_`;
    case 'strikethrough':
      return `~${text}~`;
    case 'monospace':
      return `\`\`\`${text}\`\`\``;
    default:
      return text;
  }
}
