import { z } from 'zod';
import { prisma, logger } from '../../config';
import { AppError } from '../../common/errors';
import { AutomationType, AutomationLogStatus } from '@prisma/client';

// Validation schemas
const createAutomationSchema = z.object({
  type: z.nativeEnum(AutomationType),
  template: z.string().min(1),
  delayHours: z.number().int().min(0).optional(),
  delayDays: z.number().int().min(0).optional(),
  sendTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  serviceId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
});

const updateAutomationSchema = createAutomationSchema.partial();

export class AutomationService {
  /**
   * Get all automations for a business
   */
  async getAll(businessId: string) {
    return prisma.automation.findMany({
      where: { businessId },
      include: {
        service: { select: { id: true, name: true } },
        _count: { select: { logs: true } },
      },
      orderBy: { type: 'asc' },
    });
  }

  /**
   * Get automation by ID
   */
  async getById(businessId: string, id: string) {
    const automation = await prisma.automation.findFirst({
      where: { id, businessId },
      include: {
        service: { select: { id: true, name: true } },
        logs: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            client: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (!automation) {
      throw new AppError('Automação não encontrada', 404);
    }

    return automation;
  }

  /**
   * Create or update automation
   */
  async upsert(businessId: string, data: z.infer<typeof createAutomationSchema>) {
    const validated = createAutomationSchema.parse(data);

    // Check if automation already exists for this type+service combination
    const existing = await prisma.automation.findFirst({
      where: {
        businessId,
        type: validated.type,
        serviceId: validated.serviceId || null,
      },
    });

    if (existing) {
      return prisma.automation.update({
        where: { id: existing.id },
        data: validated,
      });
    }

    return prisma.automation.create({
      data: {
        businessId,
        ...validated,
      },
    });
  }

  /**
   * Update automation
   */
  async update(businessId: string, id: string, data: z.infer<typeof updateAutomationSchema>) {
    const validated = updateAutomationSchema.parse(data);

    const automation = await prisma.automation.findFirst({
      where: { id, businessId },
    });

    if (!automation) {
      throw new AppError('Automação não encontrada', 404);
    }

    return prisma.automation.update({
      where: { id },
      data: validated,
    });
  }

  /**
   * Toggle automation active status
   */
  async toggle(businessId: string, id: string) {
    const automation = await prisma.automation.findFirst({
      where: { id, businessId },
    });

    if (!automation) {
      throw new AppError('Automação não encontrada', 404);
    }

    return prisma.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    });
  }

  /**
   * Delete automation
   */
  async delete(businessId: string, id: string) {
    const automation = await prisma.automation.findFirst({
      where: { id, businessId },
    });

    if (!automation) {
      throw new AppError('Automação não encontrada', 404);
    }

    return prisma.automation.delete({ where: { id } });
  }

  /**
   * Schedule post-appointment automation
   */
  async schedulePostAppointment(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
        business: {
          include: {
            automations: {
              where: {
                type: AutomationType.POST_APPOINTMENT,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) return;

    const automation = appointment.business.automations[0];
    if (!automation) return;

    const delayHours = automation.delayHours || 2;
    const scheduledFor = new Date(appointment.endTime);
    scheduledFor.setHours(scheduledFor.getHours() + delayHours);

    await prisma.automationLog.create({
      data: {
        automationId: automation.id,
        clientId: appointment.clientId,
        appointmentId: appointment.id,
        scheduledFor,
        status: AutomationLogStatus.PENDING,
      },
    });

    logger.info({ appointmentId, automationId: automation.id }, 'Post-appointment automation scheduled');
  }

  /**
   * Schedule return reminder for a client after service
   */
  async scheduleReturnReminder(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
        business: {
          include: {
            automations: {
              where: {
                type: AutomationType.RETURN_REMINDER,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) return;

    // Find automation specific for this service or generic
    let automation = appointment.business.automations.find(
      a => a.serviceId === appointment.serviceId
    );
    if (!automation) {
      automation = appointment.business.automations.find(a => !a.serviceId);
    }
    if (!automation) return;

    const delayDays = automation.delayDays || 30;
    const scheduledFor = new Date(appointment.endTime);
    scheduledFor.setDate(scheduledFor.getDate() + delayDays);

    // Set time if configured
    if (automation.sendTime) {
      const [hours, minutes] = automation.sendTime.split(':').map(Number);
      scheduledFor.setHours(hours, minutes, 0, 0);
    }

    // Check if client already has future appointment
    const futureAppointment = await prisma.appointment.findFirst({
      where: {
        clientId: appointment.clientId,
        businessId: appointment.businessId,
        startTime: { gt: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (futureAppointment) {
      logger.info({ clientId: appointment.clientId }, 'Skipping return reminder - client has future appointment');
      return;
    }

    await prisma.automationLog.create({
      data: {
        automationId: automation.id,
        clientId: appointment.clientId,
        appointmentId: appointment.id,
        scheduledFor,
        status: AutomationLogStatus.PENDING,
      },
    });

    logger.info({ appointmentId, automationId: automation.id }, 'Return reminder scheduled');
  }

  /**
   * Get pending automations to process
   */
  async getPendingAutomations(limit = 100) {
    return prisma.automationLog.findMany({
      where: {
        status: AutomationLogStatus.PENDING,
        scheduledFor: { lte: new Date() },
      },
      include: {
        automation: true,
        client: true,
      },
      take: limit,
      orderBy: { scheduledFor: 'asc' },
    });
  }

  /**
   * Mark automation log as sent
   */
  async markAsSent(logId: string) {
    return prisma.automationLog.update({
      where: { id: logId },
      data: {
        status: AutomationLogStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Mark automation log as failed
   */
  async markAsFailed(logId: string, reason: string) {
    return prisma.automationLog.update({
      where: { id: logId },
      data: {
        status: AutomationLogStatus.FAILED,
        failedReason: reason,
      },
    });
  }

  /**
   * Get automation stats
   */
  async getStats(businessId: string) {
    const automations = await prisma.automation.findMany({
      where: { businessId },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    });

    const totalSent = await prisma.automationLog.count({
      where: {
        automation: { businessId },
        status: AutomationLogStatus.SENT,
      },
    });

    const totalConverted = await prisma.automationLog.count({
      where: {
        automation: { businessId },
        convertedToAppointment: true,
      },
    });

    return {
      automations: automations.length,
      activeAutomations: automations.filter(a => a.isActive).length,
      totalSent,
      totalConverted,
      conversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0,
    };
  }

  /**
   * Process birthday automations (called daily)
   */
  async scheduleBirthdayMessages(businessId: string) {
    const automation = await prisma.automation.findFirst({
      where: {
        businessId,
        type: AutomationType.BIRTHDAY,
        isActive: true,
      },
    });

    if (!automation) return;

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find clients with birthday today
    const clients = await prisma.client.findMany({
      where: {
        businessId,
        birthDate: {
          not: null,
        },
      },
    });

    const birthdayClients = clients.filter(client => {
      if (!client.birthDate) return false;
      const bd = new Date(client.birthDate);
      return bd.getMonth() + 1 === month && bd.getDate() === day;
    });

    // Set send time
    let scheduledFor = new Date();
    if (automation.sendTime) {
      const [hours, minutes] = automation.sendTime.split(':').map(Number);
      scheduledFor.setHours(hours, minutes, 0, 0);
    } else {
      scheduledFor.setHours(9, 0, 0, 0); // Default 9am
    }

    // If time has passed, skip
    if (scheduledFor < new Date()) {
      logger.info('Birthday automation time has passed for today');
      return;
    }

    for (const client of birthdayClients) {
      // Check if already scheduled
      const existing = await prisma.automationLog.findFirst({
        where: {
          automationId: automation.id,
          clientId: client.id,
          createdAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
          },
        },
      });

      if (existing) continue;

      await prisma.automationLog.create({
        data: {
          automationId: automation.id,
          clientId: client.id,
          scheduledFor,
          status: AutomationLogStatus.PENDING,
        },
      });

      logger.info({ clientId: client.id }, 'Birthday message scheduled');
    }
  }

  /**
   * Schedule reactivation messages for inactive clients
   */
  async scheduleReactivationMessages(businessId: string) {
    const automation = await prisma.automation.findFirst({
      where: {
        businessId,
        type: AutomationType.REACTIVATION,
        isActive: true,
      },
    });

    if (!automation) return;

    const daysInactive = automation.delayDays || 60;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    // Find inactive clients
    const inactiveClients = await prisma.client.findMany({
      where: {
        businessId,
        OR: [
          { lastVisitAt: { lt: cutoffDate } },
          { lastVisitAt: null, createdAt: { lt: cutoffDate } },
        ],
      },
    });

    // Check for recent reactivation attempts (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let scheduledFor = new Date();
    if (automation.sendTime) {
      const [hours, minutes] = automation.sendTime.split(':').map(Number);
      scheduledFor.setHours(hours, minutes, 0, 0);
    }

    for (const client of inactiveClients) {
      // Check if already sent reactivation recently
      const recentAttempt = await prisma.automationLog.findFirst({
        where: {
          automationId: automation.id,
          clientId: client.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      if (recentAttempt) continue;

      // Check if client has future appointment
      const futureAppointment = await prisma.appointment.findFirst({
        where: {
          clientId: client.id,
          startTime: { gt: new Date() },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (futureAppointment) continue;

      await prisma.automationLog.create({
        data: {
          automationId: automation.id,
          clientId: client.id,
          scheduledFor,
          status: AutomationLogStatus.PENDING,
        },
      });

      logger.info({ clientId: client.id }, 'Reactivation message scheduled');
    }
  }

  /**
   * Initialize default automations for a new business
   */
  async initializeDefaults(businessId: string) {
    const defaults = [
      {
        type: AutomationType.POST_APPOINTMENT,
        template: 'Olá {{nome}}! Obrigado pela visita hoje. Como foi seu {{servico}}? Avalie de 1 a 5',
        delayHours: 2,
        isActive: false,
      },
      {
        type: AutomationType.RETURN_REMINDER,
        template: 'Oi {{nome}}! Já faz {{dias}} dias desde seu último {{servico}}. Que tal agendar?',
        delayDays: 30,
        sendTime: '10:00',
        isActive: false,
      },
      {
        type: AutomationType.BIRTHDAY,
        template: 'Feliz aniversário, {{nome}}! Como presente, preparamos algo especial para você...',
        sendTime: '09:00',
        isActive: false,
      },
      {
        type: AutomationType.REACTIVATION,
        template: 'Oi {{nome}}, sentimos sua falta! Faz tempo que não nos vemos. Que tal voltar? Temos novidades!',
        delayDays: 60,
        sendTime: '10:00',
        isActive: false,
      },
    ];

    for (const automation of defaults) {
      // Check if automation already exists (can't use upsert with null in unique constraint)
      const existing = await prisma.automation.findFirst({
        where: {
          businessId,
          type: automation.type,
          serviceId: null,
        },
      });

      if (!existing) {
        await prisma.automation.create({
          data: { businessId, ...automation },
        });
      }
    }

    logger.info({ businessId }, 'Default automations initialized');
  }
}

export const automationService = new AutomationService();
