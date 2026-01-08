import { Queue, Worker, Job } from 'bullmq';
import { bullmqConnection, logger, prisma } from '../../config';
import { automationService } from './automation.service';
import { getWhatsAppService } from '../whatsapp/whatsapp.service';
import { AutomationType } from '@prisma/client';

interface ScheduleAutomationsJob {
  type: 'birthday' | 'reactivation' | 'daily_check';
}

interface ProcessAutomationsJob {
  type: 'process_pending';
}

// Queue for scheduling automations
export const automationScheduleQueue = new Queue<ScheduleAutomationsJob>('automation-schedule', {
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

// Queue for processing pending automations
export const automationProcessQueue = new Queue<ProcessAutomationsJob>('automation-process', {
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

// Worker for scheduling daily automations (birthday, reactivation)
const scheduleWorker = new Worker<ScheduleAutomationsJob>(
  'automation-schedule',
  async (job: Job<ScheduleAutomationsJob>) => {
    const { type } = job.data;
    logger.info({ type }, 'Running automation schedule job');

    try {
      // Get all active businesses
      const businesses = await prisma.business.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true },
      });

      for (const business of businesses) {
        try {
          if (type === 'birthday' || type === 'daily_check') {
            await automationService.scheduleBirthdayMessages(business.id);
            logger.info({ businessId: business.id }, 'Birthday messages scheduled');
          }

          if (type === 'reactivation' || type === 'daily_check') {
            await automationService.scheduleReactivationMessages(business.id);
            logger.info({ businessId: business.id }, 'Reactivation messages scheduled');
          }
        } catch (err) {
          logger.error({ businessId: business.id, error: err }, 'Failed to schedule automations for business');
        }
      }

      return { success: true, businessCount: businesses.length };
    } catch (error) {
      logger.error({ error }, 'Failed to run automation schedule job');
      throw error;
    }
  },
  {
    connection: bullmqConnection,
    concurrency: 1,
  }
);

// Worker for processing pending automations and sending messages
const processWorker = new Worker<ProcessAutomationsJob>(
  'automation-process',
  async (_job: Job<ProcessAutomationsJob>) => {
    logger.info('Processing pending automations');

    try {
      // Get pending automations
      const pendingLogs = await automationService.getPendingAutomations(50);

      if (pendingLogs.length === 0) {
        return { success: true, processed: 0 };
      }

      let processed = 0;
      let failed = 0;

      for (const log of pendingLogs) {
        try {
          // Get business WhatsApp instance ID
          const business = await prisma.business.findUnique({
            where: { id: log.automation.businessId },
            select: {
              id: true,
              name: true,
              whatsappInstanceId: true,
              whatsappConnected: true,
            },
          });

          if (!business || !business.whatsappInstanceId || !business.whatsappConnected) {
            await automationService.markAsFailed(log.id, 'Business or WhatsApp not configured');
            failed++;
            continue;
          }

          // Build message from template
          const variables: Record<string, string> = {
            nome: log.client.name || 'Cliente',
          };

          // Add service-specific variables if available
          if (log.appointmentId) {
            const appointment = await prisma.appointment.findUnique({
              where: { id: log.appointmentId },
              include: { service: true },
            });
            if (appointment?.service) {
              variables.servico = appointment.service.name;
            }
          }

          // Add days since last visit for reactivation
          if (log.automation.type === AutomationType.REACTIVATION) {
            if (log.client.lastVisitAt) {
              const daysSince = Math.floor(
                (Date.now() - log.client.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24)
              );
              variables.dias = daysSince.toString();
            }
          }

          // Add days for return reminder
          if (log.automation.type === AutomationType.RETURN_REMINDER) {
            variables.dias = (log.automation.delayDays || 30).toString();
          }

          const message = replaceTemplateVariables(log.automation.template, variables);

          // Send via WhatsApp
          const whatsappService = getWhatsAppService(business.whatsappInstanceId);

          await whatsappService.sendText({
            number: log.client.phone,
            text: message,
          });

          // Mark as sent
          await automationService.markAsSent(log.id);
          processed++;

          logger.info(
            { logId: log.id, clientId: log.clientId, type: log.automation.type },
            'Automation message sent'
          );

          // Add small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          logger.error({ logId: log.id, error: err }, 'Failed to send automation message');
          await automationService.markAsFailed(log.id, err instanceof Error ? err.message : 'Unknown error');
          failed++;
        }
      }

      return { success: true, processed, failed };
    } catch (error) {
      logger.error({ error }, 'Failed to process automations');
      throw error;
    }
  },
  {
    connection: bullmqConnection,
    concurrency: 1, // Process one at a time to avoid overwhelming WhatsApp API
  }
);

// Set up repeatable jobs
async function setupRepeatableJobs(): Promise<void> {
  try {
    // Daily job at 7:00 AM for scheduling birthday and reactivation messages
    await automationScheduleQueue.add(
      'daily-automations',
      { type: 'daily_check' },
      {
        repeat: {
          pattern: '0 7 * * *', // Every day at 7:00 AM
        },
        jobId: 'daily-automations',
      }
    );
    logger.info('Daily automation scheduling job configured (7:00 AM)');

    // Process pending automations every 5 minutes
    await automationProcessQueue.add(
      'process-pending',
      { type: 'process_pending' },
      {
        repeat: {
          pattern: '*/5 * * * *', // Every 5 minutes
        },
        jobId: 'process-pending',
      }
    );
    logger.info('Automation processing job configured (every 5 minutes)');
  } catch (error) {
    logger.error({ error }, 'Failed to setup repeatable jobs');
  }
}

// Event handlers for workers
scheduleWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'Schedule job completed');
});

scheduleWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Schedule job failed');
});

processWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'Process job completed');
});

processWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Process job failed');
});

// Initialize workers
export function initAutomationWorkers(): void {
  logger.info('Automation workers initialized');
  setupRepeatableJobs();
}

// Export for testing or manual triggering
export async function triggerDailyAutomations(): Promise<void> {
  await automationScheduleQueue.add('manual-daily', { type: 'daily_check' });
}

export async function triggerProcessPending(): Promise<void> {
  await automationProcessQueue.add('manual-process', { type: 'process_pending' });
}
