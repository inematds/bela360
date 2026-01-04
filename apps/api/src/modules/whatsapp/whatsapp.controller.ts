import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma, logger } from '../../config';
import { getWhatsAppService } from './whatsapp.service';
import { messageQueue } from './whatsapp.queue';
import { parseWebhookMessage } from './whatsapp.utils';
import { AppError } from '../../common/errors';

// Validation schemas
const connectInstanceSchema = z.object({
  businessId: z.string().cuid(),
});

const sendMessageSchema = z.object({
  businessId: z.string().cuid(),
  phone: z.string().min(10),
  message: z.string().min(1).max(4096),
});

export class WhatsAppController {
  /**
   * Connect WhatsApp instance for a business
   */
  async connectInstance(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = connectInstanceSchema.parse(req.body);

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) {
        throw new AppError('Business not found', 404);
      }

      const instanceName = `bela360_${business.slug}`;
      const whatsapp = getWhatsAppService(instanceName);

      // Create instance if not exists
      await whatsapp.createInstance();

      // Configure webhook
      const webhookUrl = `${process.env.API_URL}/api/whatsapp/webhook`;
      await whatsapp.configureWebhook({
        url: webhookUrl,
        events: [
          'messages.upsert',
          'messages.update',
          'connection.update',
          'qrcode.updated',
        ],
      });

      // Get QR code
      const qrcode = await whatsapp.getQRCode();

      // Update business with instance info
      await prisma.business.update({
        where: { id: businessId },
        data: {
          whatsappInstanceId: instanceName,
          whatsappConnected: false,
        },
      });

      res.json({
        success: true,
        data: {
          instanceName,
          qrcode,
          status: 'awaiting_scan',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get connection status
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business || !business.whatsappInstanceId) {
        throw new AppError('WhatsApp not configured for this business', 404);
      }

      const whatsapp = getWhatsAppService(business.whatsappInstanceId);
      const status = await whatsapp.getInstanceStatus();

      res.json({
        success: true,
        data: {
          connected: business.whatsappConnected,
          state: status.state,
          connectedAt: business.whatsappConnectedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get new QR code
   */
  async getQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business || !business.whatsappInstanceId) {
        throw new AppError('WhatsApp not configured for this business', 404);
      }

      const whatsapp = getWhatsAppService(business.whatsappInstanceId);
      const qrcode = await whatsapp.getQRCode();

      res.json({
        success: true,
        data: { qrcode },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send message
   */
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, phone, message } = sendMessageSchema.parse(req.body);

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business || !business.whatsappInstanceId) {
        throw new AppError('WhatsApp not configured for this business', 404);
      }

      if (!business.whatsappConnected) {
        throw new AppError('WhatsApp not connected', 400);
      }

      const whatsapp = getWhatsAppService(business.whatsappInstanceId);
      const result = await whatsapp.sendText({ number: phone, text: message });

      // Save message to database
      await prisma.message.create({
        data: {
          businessId,
          remoteJid: phone,
          direction: 'OUTBOUND',
          content: message,
          status: 'SENT',
          sentAt: new Date(),
          isFromBot: false,
        },
      });

      res.json({
        success: true,
        data: { messageId: result.messageId },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect WhatsApp
   */
  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business || !business.whatsappInstanceId) {
        throw new AppError('WhatsApp not configured for this business', 404);
      }

      const whatsapp = getWhatsAppService(business.whatsappInstanceId);
      await whatsapp.logout();

      await prisma.business.update({
        where: { id: businessId },
        data: {
          whatsappConnected: false,
          whatsappConnectedAt: null,
        },
      });

      res.json({
        success: true,
        message: 'WhatsApp disconnected',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Evolution API webhook
   */
  async handleWebhook(req: Request, res: Response, _next: NextFunction) {
    try {
      const { event, instance, data } = req.body;

      logger.debug({ event, instance }, 'Webhook received');

      // Find business by instance
      const business = await prisma.business.findFirst({
        where: { whatsappInstanceId: instance },
      });

      if (!business) {
        logger.warn({ instance }, 'Business not found for webhook instance');
        return res.sendStatus(200);
      }

      switch (event) {
        case 'connection.update':
          await this.handleConnectionUpdate(business.id, data);
          break;

        case 'messages.upsert':
          await this.handleMessageReceived(business.id, data);
          break;

        case 'messages.update':
          await this.handleMessageUpdate(business.id, data);
          break;

        case 'qrcode.updated':
          logger.info({ businessId: business.id }, 'QR Code updated');
          break;

        default:
          logger.debug({ event }, 'Unhandled webhook event');
      }

      res.sendStatus(200);
    } catch (error) {
      logger.error({ error }, 'Webhook error');
      res.sendStatus(200); // Always return 200 to Evolution API
    }
  }

  /**
   * Handle connection status changes
   */
  private async handleConnectionUpdate(businessId: string, data: any) {
    const { state } = data;

    if (state === 'open') {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          whatsappConnected: true,
          whatsappConnectedAt: new Date(),
        },
      });
      logger.info({ businessId }, 'WhatsApp connected');
    } else if (state === 'close') {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          whatsappConnected: false,
        },
      });
      logger.info({ businessId }, 'WhatsApp disconnected');
    }
  }

  /**
   * Handle incoming messages
   */
  private async handleMessageReceived(businessId: string, data: any) {
    const messages = Array.isArray(data) ? data : [data];

    for (const msg of messages) {
      // Skip messages sent by us
      if (msg.key?.fromMe) continue;

      const parsed = parseWebhookMessage(msg);
      if (!parsed) continue;

      // Find or create client
      let client = await prisma.client.findFirst({
        where: {
          businessId,
          phone: parsed.phoneNumber,
        },
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            businessId,
            phone: parsed.phoneNumber,
            name: parsed.pushName || 'Novo Cliente',
          },
        });
      }

      // Save message
      await prisma.message.create({
        data: {
          businessId,
          clientId: client.id,
          whatsappMessageId: parsed.messageId,
          remoteJid: parsed.remoteJid,
          direction: 'INBOUND',
          content: parsed.text,
          mediaUrl: parsed.mediaUrl,
          mediaType: parsed.mediaType,
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      // Add to processing queue
      await messageQueue.add('process-message', {
        businessId,
        clientId: client.id,
        messageId: parsed.messageId,
        text: parsed.text,
        buttonResponse: parsed.buttonResponse,
        listResponse: parsed.listResponse,
      });
    }
  }

  /**
   * Handle message status updates
   */
  private async handleMessageUpdate(businessId: string, data: any) {
    const updates = Array.isArray(data) ? data : [data];

    for (const update of updates) {
      const { key, update: statusUpdate } = update;
      if (!key?.id || !statusUpdate?.status) continue;

      const statusMap: Record<string, string> = {
        PENDING: 'PENDING',
        SENT: 'SENT',
        DELIVERED: 'DELIVERED',
        READ: 'READ',
        PLAYED: 'READ',
      };

      const status = statusMap[statusUpdate.status];
      if (!status) continue;

      await prisma.message.updateMany({
        where: {
          businessId,
          whatsappMessageId: key.id,
        },
        data: {
          status: status as any,
          ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
          ...(status === 'READ' && { readAt: new Date() }),
        },
      });
    }
  }
}

export const whatsappController = new WhatsAppController();
