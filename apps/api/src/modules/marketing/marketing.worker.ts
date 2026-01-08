import { Queue, Worker, Job } from 'bullmq';
import { bullmqConnection, logger, prisma } from '../../config';
import { marketingService } from './marketing.service';
import { suggestionsService } from './suggestions.service';
import { getWhatsAppService } from '../whatsapp/whatsapp.service';
import { CampaignStatus } from '@prisma/client';

interface CampaignSendJob {
  type: 'send_campaign' | 'check_scheduled' | 'generate_suggestions';
}

interface CampaignMessageJob {
  campaignId: string;
  recipientId: string;
  businessId: string;
}

// Queue for campaign scheduling checks
export const campaignScheduleQueue = new Queue<CampaignSendJob>('campaign-schedule', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

// Queue for individual campaign messages
export const campaignMessageQueue = new Queue<CampaignMessageJob>('campaign-message', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

// Template variable replacer
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

// Worker for checking scheduled campaigns and generating suggestions
const scheduleWorker = new Worker<CampaignSendJob>(
  'campaign-schedule',
  async (job: Job<CampaignSendJob>) => {
    const { type } = job.data;
    logger.info({ type }, 'Running campaign schedule job');

    try {
      if (type === 'check_scheduled') {
        // Find campaigns scheduled for now or before
        const scheduledCampaigns = await prisma.campaign.findMany({
          where: {
            status: CampaignStatus.SCHEDULED,
            scheduledFor: { lte: new Date() },
          },
          select: { id: true, businessId: true },
        });

        for (const campaign of scheduledCampaigns) {
          await queueCampaignMessages(campaign.id, campaign.businessId);
          logger.info({ campaignId: campaign.id }, 'Scheduled campaign started');
        }

        return { success: true, campaignsStarted: scheduledCampaigns.length };
      }

      if (type === 'generate_suggestions') {
        // Generate marketing suggestions for all active businesses
        const businesses = await prisma.business.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });

        for (const business of businesses) {
          try {
            await suggestionsService.generateSuggestions(business.id);
          } catch (err) {
            logger.error({ businessId: business.id, error: err }, 'Failed to generate suggestions');
          }
        }

        return { success: true, businessesProcessed: businesses.length };
      }

      return { success: true };
    } catch (error) {
      logger.error({ error }, 'Failed to run campaign schedule job');
      throw error;
    }
  },
  {
    connection: bullmqConnection,
    concurrency: 1,
  }
);

// Worker for sending individual campaign messages
const messageWorker = new Worker<CampaignMessageJob>(
  'campaign-message',
  async (job: Job<CampaignMessageJob>) => {
    const { campaignId, recipientId, businessId } = job.data;

    try {
      // Get recipient with client info
      const recipient = await prisma.campaignRecipient.findUnique({
        where: { id: recipientId },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          campaign: { select: { id: true, message: true, status: true } },
        },
      });

      if (!recipient) {
        logger.warn({ recipientId }, 'Campaign recipient not found');
        return { success: false, reason: 'Recipient not found' };
      }

      // Check if already sent
      if (recipient.sentAt) {
        logger.info({ recipientId }, 'Message already sent to recipient');
        return { success: true, reason: 'Already sent' };
      }

      // Check campaign is still active
      if (recipient.campaign.status !== CampaignStatus.SENDING) {
        logger.info({ campaignId, status: recipient.campaign.status }, 'Campaign no longer sending');
        return { success: false, reason: 'Campaign not sending' };
      }

      // Get business WhatsApp configuration
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          name: true,
          whatsappInstanceId: true,
          whatsappConnected: true,
        },
      });

      if (!business || !business.whatsappInstanceId || !business.whatsappConnected) {
        await marketingService.updateRecipientStatus(recipientId, false, 'WhatsApp not configured');
        return { success: false, reason: 'WhatsApp not configured' };
      }

      // Build personalized message
      const clientName = recipient.client.name?.split(' ')[0] || 'Cliente';
      const variables: Record<string, string> = {
        nome: clientName,
        nome_completo: recipient.client.name || 'Cliente',
        salao: business.name,
      };

      const message = replaceTemplateVariables(recipient.campaign.message, variables);

      // Send via WhatsApp
      const whatsappService = getWhatsAppService(business.whatsappInstanceId);

      await whatsappService.sendText({
        number: recipient.client.phone,
        text: message,
      });

      // Mark as sent
      await marketingService.updateRecipientStatus(recipientId, true);

      logger.info(
        { recipientId, clientId: recipient.clientId, campaignId },
        'Campaign message sent'
      );

      return { success: true, clientId: recipient.clientId };
    } catch (error) {
      logger.error({ recipientId, campaignId, error }, 'Failed to send campaign message');

      // Mark as failed
      await marketingService.updateRecipientStatus(
        recipientId,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  },
  {
    connection: bullmqConnection,
    concurrency: 3, // Send 3 messages at a time
    limiter: {
      max: 20, // Max 20 messages
      duration: 60000, // Per minute (rate limiting)
    },
  }
);

/**
 * Queue all campaign messages for sending
 */
export async function queueCampaignMessages(campaignId: string, businessId: string): Promise<void> {
  // Update campaign status to SENDING
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: CampaignStatus.SENDING,
      startedAt: new Date(),
    },
  });

  // Get all recipients that haven't been sent
  const recipients = await prisma.campaignRecipient.findMany({
    where: {
      campaignId,
      sentAt: null,
      failed: false,
    },
    select: { id: true },
  });

  // Queue each recipient message with delay between batches
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const delay = Math.floor(i / 20) * 60000; // 1 minute delay every 20 messages

    await campaignMessageQueue.add(
      `campaign-${campaignId}-${recipient.id}`,
      {
        campaignId,
        recipientId: recipient.id,
        businessId,
      },
      { delay }
    );
  }

  logger.info({ campaignId, recipientCount: recipients.length }, 'Campaign messages queued');
}

// Set up repeatable jobs
async function setupRepeatableJobs(): Promise<void> {
  try {
    // Check for scheduled campaigns every 5 minutes
    await campaignScheduleQueue.add(
      'check-scheduled',
      { type: 'check_scheduled' },
      {
        repeat: {
          pattern: '*/5 * * * *', // Every 5 minutes
        },
        jobId: 'check-scheduled-campaigns',
      }
    );
    logger.info('Campaign schedule check job configured (every 5 minutes)');

    // Generate marketing suggestions daily at 8:00 AM
    await campaignScheduleQueue.add(
      'generate-suggestions',
      { type: 'generate_suggestions' },
      {
        repeat: {
          pattern: '0 8 * * *', // Every day at 8:00 AM
        },
        jobId: 'generate-suggestions',
      }
    );
    logger.info('Marketing suggestions job configured (daily at 8:00 AM)');
  } catch (error) {
    logger.error({ error }, 'Failed to setup campaign repeatable jobs');
  }
}

// Event handlers
scheduleWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'Campaign schedule job completed');
});

scheduleWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Campaign schedule job failed');
});

messageWorker.on('completed', (job, result) => {
  logger.debug({ jobId: job.id, result }, 'Campaign message job completed');
});

messageWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Campaign message job failed');
});

// Initialize workers
export function initMarketingWorkers(): void {
  logger.info('Marketing workers initialized');
  setupRepeatableJobs();
}

// Export for manual triggering
export async function triggerScheduledCheck(): Promise<void> {
  await campaignScheduleQueue.add('manual-check', { type: 'check_scheduled' });
}
