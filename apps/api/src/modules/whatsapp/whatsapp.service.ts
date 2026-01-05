import axios, { AxiosInstance } from 'axios';
import { env, logger } from '../../config';

interface SendMessagePayload {
  number: string;
  text: string;
}

interface SendMediaPayload {
  number: string;
  mediaUrl: string;
  caption?: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
}

interface InstanceInfo {
  instanceName: string;
  state: string;
  qrcode?: string;
}

interface WebhookConfig {
  url: string;
  events: string[];
}

export class WhatsAppService {
  private client: AxiosInstance;
  private instanceName: string;

  constructor(instanceName: string) {
    this.instanceName = instanceName;
    this.client = axios.create({
      baseURL: env.EVOLUTION_API_URL,
      headers: {
        'Content-Type': 'application/json',
        apikey: env.EVOLUTION_API_KEY,
      },
      timeout: 30000,
    });
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(): Promise<InstanceInfo> {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName: this.instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });

      logger.info({ instanceName: this.instanceName }, 'WhatsApp instance created');
      return response.data;
    } catch (error) {
      logger.error({ error, instanceName: this.instanceName }, 'Failed to create WhatsApp instance');
      throw error;
    }
  }

  /**
   * Get instance connection status
   */
  async getInstanceStatus(): Promise<InstanceInfo> {
    try {
      const response = await this.client.get(`/instance/connectionState/${this.instanceName}`);
      return response.data;
    } catch (error) {
      logger.error({ error, instanceName: this.instanceName }, 'Failed to get instance status');
      throw error;
    }
  }

  /**
   * Get QR Code for connection
   */
  async getQRCode(): Promise<string> {
    try {
      const response = await this.client.get(`/instance/connect/${this.instanceName}`);
      return response.data.qrcode?.base64 || response.data.qrcode;
    } catch (error) {
      logger.error({ error, instanceName: this.instanceName }, 'Failed to get QR code');
      throw error;
    }
  }

  /**
   * Configure webhook for receiving messages
   */
  async configureWebhook(config: WebhookConfig): Promise<void> {
    try {
      await this.client.post(`/webhook/set/${this.instanceName}`, {
        webhook: {
          enabled: true,
          url: config.url,
          events: config.events,
          webhookByEvents: true,
        },
      });

      logger.info({ instanceName: this.instanceName, url: config.url }, 'Webhook configured');
    } catch (error) {
      logger.error({ error, instanceName: this.instanceName }, 'Failed to configure webhook');
      throw error;
    }
  }

  /**
   * Send text message
   */
  async sendText(payload: SendMessagePayload): Promise<{ messageId: string }> {
    try {
      const response = await this.client.post(`/message/sendText/${this.instanceName}`, {
        number: this.formatPhoneNumber(payload.number),
        text: payload.text,
      });

      logger.info(
        { instanceName: this.instanceName, to: payload.number },
        'Text message sent'
      );

      return { messageId: response.data.key?.id || response.data.messageId };
    } catch (error) {
      logger.error(
        { error, instanceName: this.instanceName, to: payload.number },
        'Failed to send text message'
      );
      throw error;
    }
  }

  /**
   * Send media message (image, video, audio, document)
   */
  async sendMedia(payload: SendMediaPayload): Promise<{ messageId: string }> {
    try {
      const endpoint = `/message/sendMedia/${this.instanceName}`;
      const response = await this.client.post(endpoint, {
        number: this.formatPhoneNumber(payload.number),
        mediatype: payload.mediaType,
        media: payload.mediaUrl,
        caption: payload.caption,
      });

      logger.info(
        { instanceName: this.instanceName, to: payload.number, type: payload.mediaType },
        'Media message sent'
      );

      return { messageId: response.data.key?.id || response.data.messageId };
    } catch (error) {
      logger.error(
        { error, instanceName: this.instanceName, to: payload.number },
        'Failed to send media message'
      );
      throw error;
    }
  }

  /**
   * Send button message
   */
  async sendButtons(
    number: string,
    title: string,
    description: string,
    buttons: Array<{ buttonId: string; buttonText: string }>
  ): Promise<{ messageId: string }> {
    try {
      const response = await this.client.post(`/message/sendButtons/${this.instanceName}`, {
        number: this.formatPhoneNumber(number),
        title,
        description,
        buttons: buttons.map(b => ({
          type: 'reply',
          reply: {
            id: b.buttonId,
            title: b.buttonText,
          },
        })),
      });

      return { messageId: response.data.key?.id || response.data.messageId };
    } catch (error) {
      logger.error({ error, instanceName: this.instanceName, to: number }, 'Failed to send buttons');
      throw error;
    }
  }

  /**
   * Send list message
   */
  async sendList(
    number: string,
    title: string,
    description: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ title: string; description?: string; rowId: string }>;
    }>
  ): Promise<{ messageId: string }> {
    try {
      const response = await this.client.post(`/message/sendList/${this.instanceName}`, {
        number: this.formatPhoneNumber(number),
        title,
        description,
        buttonText,
        sections,
      });

      return { messageId: response.data.key?.id || response.data.messageId };
    } catch (error) {
      logger.error({ error, instanceName: this.instanceName, to: number }, 'Failed to send list');
      throw error;
    }
  }

  /**
   * Logout and disconnect instance
   */
  async logout(): Promise<void> {
    try {
      await this.client.delete(`/instance/logout/${this.instanceName}`);
      logger.info({ instanceName: this.instanceName }, 'WhatsApp instance logged out');
    } catch (error) {
      logger.error({ error, instanceName: this.instanceName }, 'Failed to logout');
      throw error;
    }
  }

  /**
   * Delete instance
   */
  async deleteInstance(): Promise<void> {
    try {
      await this.client.delete(`/instance/delete/${this.instanceName}`);
      logger.info({ instanceName: this.instanceName }, 'WhatsApp instance deleted');
    } catch (error) {
      logger.error({ error, instanceName: this.instanceName }, 'Failed to delete instance');
      throw error;
    }
  }

  /**
   * Format phone number to WhatsApp format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Add Brazil country code if not present
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }
}

// Factory function to get WhatsApp service for a business
export function getWhatsAppService(instanceName: string): WhatsAppService {
  return new WhatsAppService(instanceName);
}

// Global system instance for OTP and system messages
const SYSTEM_INSTANCE_NAME = 'bela360_system';
let systemWhatsAppService: WhatsAppService | null = null;

export function getSystemWhatsAppService(): WhatsAppService {
  if (!systemWhatsAppService) {
    systemWhatsAppService = new WhatsAppService(SYSTEM_INSTANCE_NAME);
  }
  return systemWhatsAppService;
}

export { SYSTEM_INSTANCE_NAME };
