import { Queue, Worker, Job } from 'bullmq';
import { redis, logger, prisma } from '../../config';
import { getWhatsAppService } from './whatsapp.service';
import { analyzeIntent } from './whatsapp.chatbot';

interface ProcessMessageJob {
  businessId: string;
  clientId: string;
  messageId: string;
  text: string;
  buttonResponse?: { buttonId: string; displayText: string };
  listResponse?: { rowId: string; title: string };
}

interface SendMessageJob {
  businessId: string;
  phone: string;
  message: string;
  templateType?: string;
}

interface SendReminderJob {
  appointmentId: string;
}

// Create queues
export const messageQueue = new Queue<ProcessMessageJob>('whatsapp-messages', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const sendQueue = new Queue<SendMessageJob>('whatsapp-send', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const reminderQueue = new Queue<SendReminderJob>('whatsapp-reminders', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// Message processing worker
export const messageWorker = new Worker<ProcessMessageJob>(
  'whatsapp-messages',
  async (job: Job<ProcessMessageJob>) => {
    const { businessId, clientId, messageId, text, buttonResponse, listResponse } = job.data;

    logger.info({ jobId: job.id, messageId }, 'Processing incoming message');

    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          services: { where: { isActive: true } },
          users: { where: { role: 'PROFESSIONAL', isActive: true } },
        },
      });

      if (!business || !business.whatsappInstanceId) {
        throw new Error('Business or WhatsApp not configured');
      }

      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Analyze message intent
      const intent = analyzeIntent(text, buttonResponse, listResponse);

      // Update message with detected intent
      await prisma.message.updateMany({
        where: { whatsappMessageId: messageId },
        data: { intent: intent.intent },
      });

      // Process based on intent
      const whatsapp = getWhatsAppService(business.whatsappInstanceId);
      const response = await generateResponse(business, client, intent, text);

      if (response) {
        // Send response
        await whatsapp.sendText({
          number: client.phone,
          text: response.message,
        });

        // Save bot response
        await prisma.message.create({
          data: {
            businessId,
            clientId,
            remoteJid: client.phone,
            direction: 'OUTBOUND',
            content: response.message,
            status: 'SENT',
            sentAt: new Date(),
            isFromBot: true,
            intent: intent.intent,
          },
        });

        // If we need to send buttons or list
        if (response.buttons) {
          await whatsapp.sendButtons(
            client.phone,
            response.buttonTitle || '',
            response.buttonDescription || '',
            response.buttons
          );
        }

        if (response.list) {
          await whatsapp.sendList(
            client.phone,
            response.listTitle || '',
            response.listDescription || '',
            response.listButtonText || 'Ver opções',
            response.list
          );
        }
      }

      logger.info({ jobId: job.id, intent: intent.intent }, 'Message processed successfully');
    } catch (error) {
      logger.error({ error, jobId: job.id }, 'Failed to process message');
      throw error;
    }
  },
  { connection: redis, concurrency: 5 }
);

// Send message worker
export const sendWorker = new Worker<SendMessageJob>(
  'whatsapp-send',
  async (job: Job<SendMessageJob>) => {
    const { businessId, phone, message } = job.data;

    logger.info({ jobId: job.id, phone }, 'Sending message');

    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business?.whatsappInstanceId || !business.whatsappConnected) {
        throw new Error('WhatsApp not connected');
      }

      const whatsapp = getWhatsAppService(business.whatsappInstanceId);
      await whatsapp.sendText({ number: phone, text: message });

      logger.info({ jobId: job.id }, 'Message sent successfully');
    } catch (error) {
      logger.error({ error, jobId: job.id }, 'Failed to send message');
      throw error;
    }
  },
  { connection: redis, concurrency: 10 }
);

// Reminder worker
export const reminderWorker = new Worker<SendReminderJob>(
  'whatsapp-reminders',
  async (job: Job<SendReminderJob>) => {
    const { appointmentId } = job.data;

    logger.info({ jobId: job.id, appointmentId }, 'Sending reminder');

    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          business: true,
          client: true,
          service: true,
          professional: true,
        },
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
        logger.info({ appointmentId }, 'Appointment not pending/confirmed, skipping reminder');
        return;
      }

      const { business, client, service, professional } = appointment;

      if (!business.whatsappInstanceId || !business.whatsappConnected) {
        throw new Error('WhatsApp not connected');
      }

      // Format reminder message
      const date = appointment.startTime.toLocaleDateString('pt-BR');
      const time = appointment.startTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const message = `Olá ${client.name}! 👋\n\nLembrete do seu agendamento:\n\n📅 *${date}* às *${time}*\n💇 ${service.name}\n👤 Com ${professional.name}\n📍 ${business.name}\n\nPodemos confirmar sua presença?`;

      const whatsapp = getWhatsAppService(business.whatsappInstanceId);

      await whatsapp.sendButtons(client.phone, 'Confirmação', message, [
        { buttonId: `confirm_${appointmentId}`, buttonText: '✅ Confirmar' },
        { buttonId: `cancel_${appointmentId}`, buttonText: '❌ Cancelar' },
        { buttonId: `reschedule_${appointmentId}`, buttonText: '📅 Reagendar' },
      ]);

      // Update appointment
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { reminderSentAt: new Date() },
      });

      logger.info({ appointmentId }, 'Reminder sent successfully');
    } catch (error) {
      logger.error({ error, appointmentId }, 'Failed to send reminder');
      throw error;
    }
  },
  { connection: redis, concurrency: 5 }
);

// Helper function to generate response based on intent
async function generateResponse(
  business: any,
  client: any,
  intent: { intent: string; entities: any },
  _originalText: string
): Promise<{
  message: string;
  buttons?: Array<{ buttonId: string; buttonText: string }>;
  buttonTitle?: string;
  buttonDescription?: string;
  list?: Array<{ title: string; rows: Array<{ title: string; description?: string; rowId: string }> }>;
  listTitle?: string;
  listDescription?: string;
  listButtonText?: string;
} | null> {
  switch (intent.intent) {
    case 'GREETING':
      return {
        message: `Olá ${client.name}! 👋\n\nBem-vindo(a) ao ${business.name}!\n\nComo posso ajudar você hoje?`,
        buttons: [
          { buttonId: 'schedule', buttonText: '📅 Agendar' },
          { buttonId: 'services', buttonText: '💇 Ver serviços' },
          { buttonId: 'hours', buttonText: '🕐 Horários' },
        ],
        buttonTitle: 'Menu Principal',
        buttonDescription: 'Escolha uma opção:',
      };

    case 'LIST_SERVICES':
      const services = business.services.slice(0, 10);
      return {
        message: `Confira nossos serviços disponíveis:`,
        list: [
          {
            title: 'Serviços',
            rows: services.map((s: any) => ({
              title: s.name,
              description: `R$ ${s.price} - ${s.duration}min`,
              rowId: `service_${s.id}`,
            })),
          },
        ],
        listTitle: 'Nossos Serviços',
        listDescription: 'Escolha um serviço para agendar',
        listButtonText: 'Ver serviços',
      };

    case 'SCHEDULE_APPOINTMENT':
      return {
        message: `Ótimo! Vamos agendar seu horário. 📅\n\nQual serviço você deseja?`,
        list: [
          {
            title: 'Serviços Disponíveis',
            rows: business.services.slice(0, 10).map((s: any) => ({
              title: s.name,
              description: `R$ ${s.price} - ${s.duration}min`,
              rowId: `book_service_${s.id}`,
            })),
          },
        ],
        listTitle: 'Agendar Horário',
        listDescription: 'Selecione o serviço desejado',
        listButtonText: 'Escolher serviço',
      };

    case 'CHECK_AVAILABILITY':
      return {
        message: `Para verificar a disponibilidade, preciso saber:\n\n1️⃣ Qual serviço você deseja?\n2️⃣ Tem preferência de profissional?\n3️⃣ Qual data?`,
      };

    case 'TALK_TO_HUMAN':
      return {
        message: `Entendi! Vou notificar nossa equipe para falar com você. 👋\n\nEm breve alguém entrará em contato.`,
      };

    case 'CONFIRM_APPOINTMENT':
      return {
        message: `Seu agendamento foi confirmado! ✅\n\nAté lá! 😊`,
      };

    case 'CANCEL_APPOINTMENT':
      return {
        message: `Seu agendamento foi cancelado. 😔\n\nEsperamos vê-lo(a) em breve!\n\nDeseja agendar um novo horário?`,
        buttons: [
          { buttonId: 'schedule', buttonText: '📅 Novo agendamento' },
          { buttonId: 'menu', buttonText: '📋 Menu principal' },
        ],
        buttonTitle: 'Agendamento Cancelado',
        buttonDescription: 'O que deseja fazer?',
      };

    default:
      return {
        message: `Não entendi muito bem. 🤔\n\nPosso ajudar você com:\n\n📅 Agendar horário\n💇 Ver serviços\n🕐 Consultar horários\n💬 Falar com atendente`,
        buttons: [
          { buttonId: 'schedule', buttonText: '📅 Agendar' },
          { buttonId: 'services', buttonText: '💇 Serviços' },
          { buttonId: 'human', buttonText: '💬 Atendente' },
        ],
        buttonTitle: 'Como posso ajudar?',
        buttonDescription: 'Escolha uma opção:',
      };
  }
}

// Error handlers
messageWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Message processing job failed');
});

sendWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Send message job failed');
});

reminderWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Reminder job failed');
});
