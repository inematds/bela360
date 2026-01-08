import { Queue, Worker, Job } from 'bullmq';
import { bullmqConnection, logger, prisma } from '../../config';
import { getWhatsAppService } from './whatsapp.service';
import { analyzeIntent } from './whatsapp.chatbot';
import {
  getConversationState,
  setConversationState,
  clearConversationState,
  ConversationState,
  BookingData,
} from './conversation.state';
import {
  getAvailableSlots,
  getAvailableDates,
  createAppointment,
} from './availability.service';

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
  connection: bullmqConnection,
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
  connection: bullmqConnection,
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
  connection: bullmqConnection,
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

      // Get existing conversation state
      const conversationState = await getConversationState(businessId, client.phone);

      // Analyze message intent
      const intent = analyzeIntent(text, buttonResponse, listResponse);

      // Update message with detected intent
      await prisma.message.updateMany({
        where: { whatsappMessageId: messageId },
        data: { intent: intent.intent },
      });

      // Get WhatsApp service
      const whatsapp = getWhatsAppService(business.whatsappInstanceId);

      // Process based on conversation state and intent
      const response = await processMessage({
        business,
        client,
        intent,
        text,
        buttonResponse,
        listResponse,
        conversationState,
      });

      if (response) {
        // Send text response
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

        // Send buttons if any
        if (response.buttons && response.buttons.length > 0) {
          await whatsapp.sendButtons(
            client.phone,
            response.buttonTitle || '',
            response.buttonDescription || '',
            response.buttons
          );
        }

        // Send list if any
        if (response.list && response.list.length > 0) {
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
  { connection: bullmqConnection, concurrency: 5 }
);

// Main message processing function with conversation flow
async function processMessage({
  business,
  client,
  intent,
  text,
  buttonResponse,
  listResponse,
  conversationState,
}: {
  business: any;
  client: any;
  intent: { intent: string; entities: any; confidence: number };
  text: string;
  buttonResponse?: { buttonId: string; displayText: string };
  listResponse?: { rowId: string; title: string };
  conversationState: ConversationState | null;
}): Promise<MessageResponse | null> {
  const businessId = business.id;
  const clientPhone = client.phone;

  // Handle button responses for appointment actions
  if (buttonResponse) {
    const buttonId = buttonResponse.buttonId;

    // Handle confirm/cancel/reschedule appointment buttons
    if (buttonId.startsWith('confirm_')) {
      const appointmentId = buttonId.replace('confirm_', '');
      return handleConfirmAppointment(appointmentId, client);
    }

    if (buttonId.startsWith('cancel_')) {
      const appointmentId = buttonId.replace('cancel_', '');
      return handleCancelAppointment(appointmentId, client);
    }

    if (buttonId.startsWith('reschedule_')) {
      // Start new booking flow
      await clearConversationState(businessId, clientPhone);
      await setConversationState(businessId, clientPhone, 'selecting_service');
      return generateServiceSelection(business, client);
    }

    // Handle booking flow buttons
    if (buttonId.startsWith('professional_')) {
      const professionalId = buttonId.replace('professional_', '');
      const professional = business.users.find((u: any) => u.id === professionalId);

      if (professional) {
        await setConversationState(businessId, clientPhone, 'selecting_date', {
          professionalId,
          professionalName: professional.name,
        });
        return generateDateSelection(business, client, conversationState?.data || {}, professionalId);
      }
    }

    if (buttonId.startsWith('date_')) {
      const date = buttonId.replace('date_', '');
      await setConversationState(businessId, clientPhone, 'selecting_time', { date });
      return generateTimeSelection(business, client, conversationState?.data || {}, date);
    }

    if (buttonId.startsWith('time_')) {
      const time = buttonId.replace('time_', '');
      await setConversationState(businessId, clientPhone, 'confirming_booking', { time });
      return generateBookingConfirmation(business, client, conversationState?.data || {}, time);
    }

    if (buttonId === 'confirm_booking') {
      return handleCompleteBooking(business, client, conversationState?.data || {});
    }

    if (buttonId === 'cancel_booking') {
      await clearConversationState(businessId, clientPhone);
      return {
        message: 'Agendamento cancelado. Sem problemas! 👍\n\nQuando quiser agendar, é só me chamar.',
        buttons: [
          { buttonId: 'schedule', buttonText: '📅 Agendar' },
          { buttonId: 'menu', buttonText: '📋 Menu' },
        ],
        buttonTitle: 'Cancelado',
        buttonDescription: 'O que deseja fazer?',
      };
    }
  }

  // Handle list responses
  if (listResponse) {
    const rowId = listResponse.rowId;

    // Service selection
    if (rowId.startsWith('service_') || rowId.startsWith('book_service_')) {
      const serviceId = rowId.replace('book_service_', '').replace('service_', '');
      const service = business.services.find((s: any) => s.id === serviceId);

      if (service) {
        await setConversationState(businessId, clientPhone, 'selecting_professional', {
          serviceId,
          serviceName: service.name,
        });
        return generateProfessionalSelection(business, client, serviceId);
      }
    }
  }

  // Handle based on conversation state
  if (conversationState && conversationState.step !== 'initial') {
    // User might have typed instead of using buttons
    // Try to extract info from text if possible
    return handleConversationFlow(business, client, conversationState, text, intent);
  }

  // Handle fresh intent-based responses
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
      return generateServiceList(business);

    case 'SCHEDULE_APPOINTMENT':
      await setConversationState(businessId, clientPhone, 'selecting_service');
      return generateServiceSelection(business, client);

    case 'CHECK_AVAILABILITY':
      await setConversationState(businessId, clientPhone, 'selecting_service');
      const serviceSelection = generateServiceSelection(business, client);
      return {
        ...serviceSelection,
        message: `Para verificar horários disponíveis, primeiro escolha o serviço desejado:\n\n${serviceSelection.message}`,
      };

    case 'TALK_TO_HUMAN':
      // TODO: Notify staff
      return {
        message: `Entendi! Vou notificar nossa equipe para falar com você. 👋\n\nEm breve alguém entrará em contato.\n\nEnquanto isso, posso ajudar com algo mais?`,
        buttons: [
          { buttonId: 'schedule', buttonText: '📅 Agendar' },
          { buttonId: 'services', buttonText: '💇 Serviços' },
        ],
        buttonTitle: 'Outras opções',
        buttonDescription: 'Ou escolha:',
      };

    case 'CONFIRM_APPOINTMENT':
    case 'CANCEL_APPOINTMENT':
      // These should have been handled with button context
      return {
        message: `Para confirmar ou cancelar um agendamento, use os botões de confirmação que enviamos junto com o lembrete.\n\nDeseja fazer um novo agendamento?`,
        buttons: [
          { buttonId: 'schedule', buttonText: '📅 Novo agendamento' },
          { buttonId: 'menu', buttonText: '📋 Menu principal' },
        ],
        buttonTitle: 'Agendamentos',
        buttonDescription: 'Escolha:',
      };

    default:
      return {
        message: `Não entendi muito bem. 🤔\n\nPosso ajudar você com:\n\n📅 Agendar horário\n💇 Ver serviços e preços\n🕐 Consultar horários disponíveis\n💬 Falar com atendente`,
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

// Handle conversation flow when already in a booking process
async function handleConversationFlow(
  business: any,
  client: any,
  state: ConversationState,
  text: string,
  _intent: { intent: string; entities: any }
): Promise<MessageResponse> {
  const businessId = business.id;
  const clientPhone = client.phone;

  // If user wants to cancel/restart
  if (text.toLowerCase().includes('cancelar') || text.toLowerCase().includes('voltar')) {
    await clearConversationState(businessId, clientPhone);
    return {
      message: 'Ok, vamos recomeçar! 👍\n\nComo posso ajudar?',
      buttons: [
        { buttonId: 'schedule', buttonText: '📅 Agendar' },
        { buttonId: 'services', buttonText: '💇 Serviços' },
        { buttonId: 'human', buttonText: '💬 Atendente' },
      ],
      buttonTitle: 'Menu',
      buttonDescription: 'Escolha:',
    };
  }

  // Based on current step, guide user
  switch (state.step) {
    case 'selecting_service':
      return generateServiceSelection(business, client);

    case 'selecting_professional':
      return generateProfessionalSelection(business, client, state.data.serviceId!);

    case 'selecting_date':
      return generateDateSelection(business, client, state.data, state.data.professionalId!);

    case 'selecting_time':
      return generateTimeSelection(business, client, state.data, state.data.date!);

    case 'confirming_booking':
      return generateBookingConfirmation(business, client, state.data, state.data.time!);

    default:
      await clearConversationState(businessId, clientPhone);
      return {
        message: 'Algo deu errado. Vamos recomeçar!\n\nComo posso ajudar?',
        buttons: [
          { buttonId: 'schedule', buttonText: '📅 Agendar' },
          { buttonId: 'services', buttonText: '💇 Serviços' },
        ],
        buttonTitle: 'Menu',
        buttonDescription: 'Escolha:',
      };
  }
}

// Generate service list (info only)
function generateServiceList(business: any): MessageResponse {
  const services = business.services.slice(0, 10);
  const serviceList = services
    .map((s: any) => `• *${s.name}*: R$ ${parseFloat(s.price).toFixed(2)} (${s.duration}min)`)
    .join('\n');

  return {
    message: `💇 *Nossos Serviços*\n\n${serviceList}\n\nDeseja agendar algum desses serviços?`,
    buttons: [
      { buttonId: 'schedule', buttonText: '📅 Agendar' },
      { buttonId: 'menu', buttonText: '📋 Menu' },
    ],
    buttonTitle: 'Serviços',
    buttonDescription: 'O que deseja fazer?',
  };
}

// Generate service selection for booking
function generateServiceSelection(business: any, client: any): MessageResponse {
  const services = business.services.slice(0, 10);

  return {
    message: `Ótimo, ${client.name}! Vamos agendar seu horário. 📅\n\nEscolha o serviço desejado:`,
    list: [
      {
        title: 'Serviços Disponíveis',
        rows: services.map((s: any) => ({
          title: s.name,
          description: `R$ ${parseFloat(s.price).toFixed(2)} - ${s.duration}min`,
          rowId: `book_service_${s.id}`,
        })),
      },
    ],
    listTitle: 'Agendar Horário',
    listDescription: 'Selecione o serviço',
    listButtonText: 'Escolher serviço',
  };
}

// Generate professional selection
async function generateProfessionalSelection(
  business: any,
  client: any,
  serviceId: string
): Promise<MessageResponse> {
  // Get professionals who can do this service
  const serviceProfessionals = await prisma.serviceProfessional.findMany({
    where: { serviceId },
    include: { professional: true },
  });

  const professionals =
    serviceProfessionals.length > 0
      ? serviceProfessionals.map(sp => sp.professional)
      : business.users;

  if (professionals.length === 0) {
    return {
      message: 'Desculpe, não há profissionais disponíveis para este serviço no momento.',
      buttons: [
        { buttonId: 'schedule', buttonText: '📅 Outro serviço' },
        { buttonId: 'human', buttonText: '💬 Atendente' },
      ],
      buttonTitle: 'Ops!',
      buttonDescription: 'O que fazer?',
    };
  }

  if (professionals.length === 1) {
    // Auto-select single professional
    const prof = professionals[0];
    await setConversationState(business.id, client.phone, 'selecting_date', {
      professionalId: prof.id,
      professionalName: prof.name,
    });
    const state = await getConversationState(business.id, client.phone);
    return generateDateSelection(business, client, state?.data || {}, prof.id);
  }

  return {
    message: `Escolha o profissional de sua preferência:`,
    buttons: professionals.slice(0, 3).map((p: any) => ({
      buttonId: `professional_${p.id}`,
      buttonText: `👤 ${p.name}`,
    })),
    buttonTitle: 'Profissionais',
    buttonDescription: 'Selecione:',
  };
}

// Generate date selection
async function generateDateSelection(
  business: any,
  client: any,
  bookingData: BookingData,
  professionalId: string
): Promise<MessageResponse> {
  const serviceId = bookingData.serviceId;

  if (!serviceId) {
    return generateServiceSelection(business, client);
  }

  const availableDates = await getAvailableDates(business.id, professionalId, serviceId, 7);

  if (availableDates.length === 0) {
    return {
      message: `Desculpe, não há horários disponíveis nos próximos 7 dias para ${bookingData.professionalName || 'este profissional'}.\n\nDeseja tentar com outro profissional?`,
      buttons: [
        { buttonId: 'schedule', buttonText: '📅 Recomeçar' },
        { buttonId: 'human', buttonText: '💬 Atendente' },
      ],
      buttonTitle: 'Sem horários',
      buttonDescription: 'O que fazer?',
    };
  }

  return {
    message: `*Serviço:* ${bookingData.serviceName}\n*Profissional:* ${bookingData.professionalName}\n\nEscolha a data:`,
    buttons: availableDates.slice(0, 3).map(d => ({
      buttonId: `date_${d.date}`,
      buttonText: `📅 ${d.label}`,
    })),
    buttonTitle: 'Datas Disponíveis',
    buttonDescription: 'Selecione a data:',
  };
}

// Generate time selection
async function generateTimeSelection(
  business: any,
  client: any,
  bookingData: BookingData,
  date: string
): Promise<MessageResponse> {
  const { serviceId, professionalId, serviceName, professionalName } = bookingData;

  if (!serviceId || !professionalId) {
    return generateServiceSelection(business, client);
  }

  const slots = await getAvailableSlots(business.id, professionalId, serviceId, date);

  if (slots.length === 0) {
    return {
      message: `Desculpe, não há horários disponíveis nesta data.\n\nDeseja escolher outra data?`,
      buttons: [{ buttonId: 'schedule', buttonText: '📅 Escolher outra data' }],
      buttonTitle: 'Sem horários',
      buttonDescription: 'Tente outra data',
    };
  }

  // Format date for display
  const dateObj = new Date(date + 'T12:00:00');
  const dateFormatted = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

  // Show up to 3 times as buttons
  return {
    message: `*Serviço:* ${serviceName}\n*Profissional:* ${professionalName}\n*Data:* ${dateFormatted}\n\nEscolha o horário:`,
    buttons: slots.slice(0, 3).map(s => ({
      buttonId: `time_${s.time}`,
      buttonText: `🕐 ${s.label}`,
    })),
    buttonTitle: 'Horários Disponíveis',
    buttonDescription: 'Selecione o horário:',
  };
}

// Generate booking confirmation
async function generateBookingConfirmation(
  business: any,
  _client: any,
  bookingData: BookingData,
  time: string
): Promise<MessageResponse> {
  const { serviceName, professionalName, date } = bookingData;

  // Format date for display
  const dateObj = new Date(date + 'T12:00:00');
  const dateFormatted = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

  return {
    message: `📋 *Confirme seu Agendamento*\n\n💇 *Serviço:* ${serviceName}\n👤 *Profissional:* ${professionalName}\n📅 *Data:* ${dateFormatted}\n🕐 *Horário:* ${time}\n📍 *Local:* ${business.name}\n\nEstá tudo certo?`,
    buttons: [
      { buttonId: 'confirm_booking', buttonText: '✅ Confirmar' },
      { buttonId: 'cancel_booking', buttonText: '❌ Cancelar' },
    ],
    buttonTitle: 'Confirmação',
    buttonDescription: 'Confirme seu agendamento:',
  };
}

// Handle completing the booking
async function handleCompleteBooking(
  business: any,
  client: any,
  bookingData: BookingData
): Promise<MessageResponse> {
  const { serviceId, professionalId, serviceName, professionalName, date, time } = bookingData;

  if (!serviceId || !professionalId || !date || !time) {
    await clearConversationState(business.id, client.phone);
    return {
      message: 'Algo deu errado com os dados do agendamento. Vamos recomeçar?',
      buttons: [{ buttonId: 'schedule', buttonText: '📅 Agendar' }],
      buttonTitle: 'Erro',
      buttonDescription: 'Tente novamente',
    };
  }

  const result = await createAppointment(
    business.id,
    client.id,
    professionalId,
    serviceId,
    date,
    time
  );

  await clearConversationState(business.id, client.phone);

  if (!result.success) {
    return {
      message: `Desculpe, não foi possível completar o agendamento: ${result.error}\n\nDeseja tentar novamente?`,
      buttons: [
        { buttonId: 'schedule', buttonText: '📅 Tentar novamente' },
        { buttonId: 'human', buttonText: '💬 Falar com atendente' },
      ],
      buttonTitle: 'Erro',
      buttonDescription: 'O que fazer?',
    };
  }

  // Format date for display
  const dateObj = new Date(date + 'T12:00:00');
  const dateFormatted = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

  return {
    message: `✅ *Agendamento Confirmado!*\n\n💇 *Serviço:* ${serviceName}\n👤 *Profissional:* ${professionalName}\n📅 *Data:* ${dateFormatted}\n🕐 *Horário:* ${time}\n📍 *Local:* ${business.name}\n\nVocê receberá um lembrete antes do horário. 💜\n\nAté lá! 👋`,
  };
}

// Handle confirm appointment from reminder
async function handleConfirmAppointment(
  appointmentId: string,
  _client: any
): Promise<MessageResponse> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, professional: true },
    });

    if (!appointment) {
      return {
        message: 'Não encontrei este agendamento. Por favor, entre em contato conosco.',
        buttons: [{ buttonId: 'human', buttonText: '💬 Atendente' }],
        buttonTitle: 'Agendamento não encontrado',
        buttonDescription: 'Fale conosco',
      };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    const date = appointment.startTime.toLocaleDateString('pt-BR');
    const time = appointment.startTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      message: `✅ *Presença Confirmada!*\n\n💇 ${appointment.service.name}\n📅 ${date} às ${time}\n👤 Com ${appointment.professional.name}\n\nTe esperamos! 💜`,
    };
  } catch (error) {
    logger.error({ error, appointmentId }, 'Error confirming appointment');
    return {
      message: 'Ocorreu um erro ao confirmar. Por favor, tente novamente ou entre em contato.',
      buttons: [{ buttonId: 'human', buttonText: '💬 Atendente' }],
      buttonTitle: 'Erro',
      buttonDescription: 'Fale conosco',
    };
  }
}

// Handle cancel appointment from reminder
async function handleCancelAppointment(
  appointmentId: string,
  _client: any
): Promise<MessageResponse> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, professional: true },
    });

    if (!appointment) {
      return {
        message: 'Não encontrei este agendamento.',
        buttons: [{ buttonId: 'human', buttonText: '💬 Atendente' }],
        buttonTitle: 'Não encontrado',
        buttonDescription: 'Fale conosco',
      };
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancellationReason: 'Cancelado via WhatsApp pelo cliente',
      },
    });

    return {
      message: `😔 *Agendamento Cancelado*\n\nSentiremos sua falta! Esperamos vê-lo(a) em breve.\n\nDeseja agendar um novo horário?`,
      buttons: [
        { buttonId: 'schedule', buttonText: '📅 Novo agendamento' },
        { buttonId: 'menu', buttonText: '📋 Menu principal' },
      ],
      buttonTitle: 'Cancelado',
      buttonDescription: 'O que deseja fazer?',
    };
  } catch (error) {
    logger.error({ error, appointmentId }, 'Error cancelling appointment');
    return {
      message: 'Ocorreu um erro ao cancelar. Por favor, entre em contato conosco.',
      buttons: [{ buttonId: 'human', buttonText: '💬 Atendente' }],
      buttonTitle: 'Erro',
      buttonDescription: 'Fale conosco',
    };
  }
}

// Response interface
interface MessageResponse {
  message: string;
  buttons?: Array<{ buttonId: string; buttonText: string }>;
  buttonTitle?: string;
  buttonDescription?: string;
  list?: Array<{
    title: string;
    rows: Array<{ title: string; description?: string; rowId: string }>;
  }>;
  listTitle?: string;
  listDescription?: string;
  listButtonText?: string;
}

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
  { connection: bullmqConnection, concurrency: 10 }
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
  { connection: bullmqConnection, concurrency: 5 }
);

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
