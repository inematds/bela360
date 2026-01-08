import { Queue, Worker, Job } from 'bullmq';
import { bullmqConnection, logger, prisma } from '../../config';
import { waitlistService } from './waitlist.service';
import { getWhatsAppService } from '../whatsapp/whatsapp.service';
import { WaitlistStatus } from '@prisma/client';

interface WaitlistCheckJob {
  type: 'check_expiration' | 'notify_available';
}

interface WaitlistNotifyJob {
  businessId: string;
  entryId: string;
  slotTime: string;
}

// Queue for checking waitlist expirations
export const waitlistCheckQueue = new Queue<WaitlistCheckJob>('waitlist-check', {
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

// Queue for notifying waitlist clients
export const waitlistNotifyQueue = new Queue<WaitlistNotifyJob>('waitlist-notify', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Worker for checking expirations and notifying next in queue
const checkWorker = new Worker<WaitlistCheckJob>(
  'waitlist-check',
  async (job: Job<WaitlistCheckJob>) => {
    const { type } = job.data;
    logger.info({ type }, 'Running waitlist check job');

    try {
      if (type === 'check_expiration') {
        // Get all entries that have expired
        const expiredEntries = await prisma.waitlist.findMany({
          where: {
            status: WaitlistStatus.NOTIFIED,
            expiresAt: { lt: new Date() },
          },
          include: {
            client: { select: { id: true, name: true, phone: true } },
            service: { select: { id: true, name: true } },
          },
        });

        // Expire them
        const expiredCount = await waitlistService.expireNotified();
        logger.info({ expiredCount }, 'Expired waitlist notifications');

        // Notify next in queue for each expired entry
        for (const expiredEntry of expiredEntries) {
          try {
            const nextEntry = await waitlistService.notifyNext(
              expiredEntry.businessId,
              expiredEntry.id
            );

            if (nextEntry) {
              // Queue WhatsApp notification for next client
              await waitlistNotifyQueue.add(
                `notify-next-${nextEntry.id}`,
                {
                  businessId: expiredEntry.businessId,
                  entryId: nextEntry.id,
                  slotTime: expiredEntry.desiredDate.toISOString(),
                }
              );
              logger.info({ entryId: nextEntry.id }, 'Queued notification for next waitlist client');
            }
          } catch (err) {
            logger.error({ entryId: expiredEntry.id, error: err }, 'Failed to notify next in queue');
          }
        }

        return { success: true, expiredCount, notifiedNext: expiredEntries.length };
      }

      return { success: true };
    } catch (error) {
      logger.error({ error }, 'Failed to run waitlist check job');
      throw error;
    }
  },
  {
    connection: bullmqConnection,
    concurrency: 1,
  }
);

// Worker for sending WhatsApp notifications
const notifyWorker = new Worker<WaitlistNotifyJob>(
  'waitlist-notify',
  async (job: Job<WaitlistNotifyJob>) => {
    const { businessId, entryId, slotTime } = job.data;
    logger.info({ businessId, entryId }, 'Sending waitlist notification');

    try {
      // Get entry details
      const entry = await prisma.waitlist.findFirst({
        where: { id: entryId, businessId },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, name: true } },
          professional: { select: { id: true, name: true } },
        },
      });

      if (!entry) {
        logger.warn({ entryId }, 'Waitlist entry not found');
        return { success: false, reason: 'Entry not found' };
      }

      if (entry.status !== WaitlistStatus.NOTIFIED) {
        logger.info({ entryId, status: entry.status }, 'Waitlist entry no longer in NOTIFIED status');
        return { success: false, reason: 'Entry status changed' };
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
        logger.warn({ businessId }, 'Business WhatsApp not configured');
        return { success: false, reason: 'WhatsApp not configured' };
      }

      // Build notification message
      const slotDate = new Date(slotTime);
      const clientName = entry.client.name?.split(' ')[0] || 'Cliente';
      const serviceName = entry.service.name;
      const professionalInfo = entry.professional ? ` com ${entry.professional.name}` : '';

      const message = `Ola ${clientName}! 🎉

Temos uma otima noticia! Surgiu uma vaga para o servico que voce estava esperando:

📋 Servico: ${serviceName}${professionalInfo}
📅 Data: ${formatDate(slotDate)}
⏰ Horario disponivel!

⚠️ Voce tem 30 minutos para confirmar este horario, caso contrario passaremos para o proximo da lista.

Deseja agendar? Responda SIM para confirmar ou NAO para recusar.

${business.name}`;

      // Send via WhatsApp
      const whatsappService = getWhatsAppService(business.whatsappInstanceId);

      await whatsappService.sendText({
        number: entry.client.phone,
        text: message,
      });

      logger.info({ entryId, clientId: entry.clientId }, 'Waitlist notification sent via WhatsApp');

      return { success: true, clientId: entry.clientId };
    } catch (error) {
      logger.error({ entryId, error }, 'Failed to send waitlist notification');
      throw error;
    }
  },
  {
    connection: bullmqConnection,
    concurrency: 2, // Can send a few notifications in parallel
  }
);

// Set up repeatable jobs
async function setupRepeatableJobs(): Promise<void> {
  try {
    // Check for expirations every 5 minutes
    await waitlistCheckQueue.add(
      'check-expirations',
      { type: 'check_expiration' },
      {
        repeat: {
          pattern: '*/5 * * * *', // Every 5 minutes
        },
        jobId: 'check-expirations',
      }
    );
    logger.info('Waitlist expiration check job configured (every 5 minutes)');
  } catch (error) {
    logger.error({ error }, 'Failed to setup waitlist repeatable jobs');
  }
}

// Event handlers
checkWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'Waitlist check job completed');
});

checkWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Waitlist check job failed');
});

notifyWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'Waitlist notify job completed');
});

notifyWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Waitlist notify job failed');
});

// Initialize workers
export function initWaitlistWorkers(): void {
  logger.info('Waitlist workers initialized');
  setupRepeatableJobs();
}

// Export for manual triggering or when slot becomes available
export async function triggerSlotAvailableNotification(
  businessId: string,
  entryId: string,
  slotTime: Date
): Promise<void> {
  await waitlistNotifyQueue.add(
    `slot-available-${entryId}`,
    {
      businessId,
      entryId,
      slotTime: slotTime.toISOString(),
    }
  );
}

export async function triggerExpirationCheck(): Promise<void> {
  await waitlistCheckQueue.add('manual-check', { type: 'check_expiration' });
}
