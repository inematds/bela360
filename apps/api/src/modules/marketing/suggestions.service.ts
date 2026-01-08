import { prisma, logger } from '../../config';
import { AppointmentStatus } from '@prisma/client';

interface IdleSlot {
  date: Date;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  professionalId: string;
  professionalName: string;
  emptyHours: number;
}

interface ServiceDemand {
  serviceId: string;
  serviceName: string;
  appointmentCount: number;
  lastBooked: Date | null;
}

export class MarketingSuggestionsService {
  /**
   * Detect idle slots in the schedule for the next 7 days
   */
  async detectIdleSlots(businessId: string): Promise<IdleSlot[]> {
    const idleSlots: IdleSlot[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get business settings for working hours
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        settings: true,
      },
    });

    if (!business) return [];

    // Parse settings for working hours (default 9-19)
    const settings = business.settings as Record<string, any> || {};
    const workStart = parseInt(settings.workingHoursStart?.split(':')[0] || '9');
    const workEnd = parseInt(settings.workingHoursEnd?.split(':')[0] || '19');
    const workHoursPerDay = workEnd - workStart;

    // Get active professionals
    const professionals = await prisma.user.findMany({
      where: {
        businessId,
        role: 'PROFESSIONAL',
        isActive: true,
      },
      select: { id: true, name: true },
    });

    // Check next 7 days
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + dayOffset);
      const nextDay = new Date(checkDate);
      nextDay.setDate(checkDate.getDate() + 1);

      for (const prof of professionals) {
        // Get appointments for this professional on this day
        const appointments = await prisma.appointment.findMany({
          where: {
            businessId,
            professionalId: prof.id,
            startTime: {
              gte: checkDate,
              lt: nextDay,
            },
            status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
          },
          select: {
            startTime: true,
            endTime: true,
          },
        });

        // Calculate busy hours
        let busyMinutes = 0;
        for (const apt of appointments) {
          busyMinutes += (apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60);
        }
        const busyHours = busyMinutes / 60;
        const emptyHours = workHoursPerDay - busyHours;

        // If more than 50% empty, flag as idle
        if (emptyHours > workHoursPerDay * 0.5) {
          // Determine which period has most gaps
          const morningApts = appointments.filter(a => a.startTime.getHours() < 12);
          const afternoonApts = appointments.filter(a => a.startTime.getHours() >= 12 && a.startTime.getHours() < 17);
          const eveningApts = appointments.filter(a => a.startTime.getHours() >= 17);

          let period: 'MORNING' | 'AFTERNOON' | 'EVENING' = 'AFTERNOON';
          if (morningApts.length === 0) period = 'MORNING';
          else if (afternoonApts.length === 0) period = 'AFTERNOON';
          else if (eveningApts.length === 0) period = 'EVENING';

          idleSlots.push({
            date: checkDate,
            period,
            professionalId: prof.id,
            professionalName: prof.name,
            emptyHours: Math.round(emptyHours * 10) / 10,
          });
        }
      }
    }

    return idleSlots;
  }

  /**
   * Identify services with low demand
   */
  async identifyLowDemandServices(businessId: string): Promise<ServiceDemand[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all active services
    const services = await prisma.service.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true },
    });

    const lowDemand: ServiceDemand[] = [];

    for (const service of services) {
      // Count appointments for this service in last 30 days
      const count = await prisma.appointment.count({
        where: {
          serviceId: service.id,
          startTime: { gte: thirtyDaysAgo },
          status: { not: AppointmentStatus.CANCELLED },
        },
      });

      // Get last booking date
      const lastApt = await prisma.appointment.findFirst({
        where: {
          serviceId: service.id,
          status: { not: AppointmentStatus.CANCELLED },
        },
        orderBy: { startTime: 'desc' },
        select: { startTime: true },
      });

      // If less than 2 bookings in 30 days, flag as low demand
      if (count < 2) {
        lowDemand.push({
          serviceId: service.id,
          serviceName: service.name,
          appointmentCount: count,
          lastBooked: lastApt?.startTime || null,
        });
      }
    }

    return lowDemand;
  }

  /**
   * Get inactive clients count
   */
  async getInactiveClientsCount(businessId: string): Promise<number> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    return prisma.client.count({
      where: {
        businessId,
        lastVisitAt: { lt: sixtyDaysAgo },
      },
    });
  }

  /**
   * Generate marketing suggestions based on analysis
   */
  async generateSuggestions(businessId: string): Promise<void> {
    logger.info({ businessId }, 'Generating marketing suggestions');

    // Clear old unread suggestions older than 7 days
    await prisma.marketingSuggestion.deleteMany({
      where: {
        businessId,
        isActioned: false,
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    // 1. Detect idle slots
    const idleSlots = await this.detectIdleSlots(businessId);
    if (idleSlots.length > 0) {
      // Group by date
      const slotsByDate = new Map<string, IdleSlot[]>();
      for (const slot of idleSlots) {
        const dateKey = slot.date.toISOString().split('T')[0];
        if (!slotsByDate.has(dateKey)) {
          slotsByDate.set(dateKey, []);
        }
        slotsByDate.get(dateKey)!.push(slot);
      }

      for (const [dateKey, slots] of slotsByDate) {
        const formattedDate = new Date(dateKey).toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

        // Check if suggestion already exists
        const existing = await prisma.marketingSuggestion.findFirst({
          where: {
            businessId,
            type: 'EMPTY_SLOT',
            metadata: { path: ['date'], equals: dateKey },
            isActioned: false,
          },
        });

        if (!existing) {
          await prisma.marketingSuggestion.create({
            data: {
              businessId,
              type: 'EMPTY_SLOT',
              title: `Agenda com vagas em ${formattedDate}`,
              description: `Identificamos ${slots.length} profissional(is) com horarios vagos. Que tal criar uma promocao relampago para preencher esses horarios?`,
              suggestedAction: 'Criar campanha promocional para este dia',
              metadata: {
                date: dateKey,
                slots: slots.map(s => ({
                  professionalId: s.professionalId,
                  professionalName: s.professionalName,
                  period: s.period,
                  emptyHours: s.emptyHours,
                })),
              },
              expiresAt: new Date(dateKey + 'T23:59:59'),
            },
          });
        }
      }
    }

    // 2. Identify low demand services
    const lowDemandServices = await this.identifyLowDemandServices(businessId);
    if (lowDemandServices.length > 0) {
      const existing = await prisma.marketingSuggestion.findFirst({
        where: {
          businessId,
          type: 'LOW_DEMAND_SERVICE',
          isActioned: false,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        const serviceNames = lowDemandServices.map(s => s.serviceName).slice(0, 3).join(', ');
        await prisma.marketingSuggestion.create({
          data: {
            businessId,
            type: 'LOW_DEMAND_SERVICE',
            title: 'Servicos com baixa procura',
            description: `Os servicos "${serviceNames}" tiveram pouca procura nos ultimos 30 dias. Considere criar promocoes ou destacar esses servicos.`,
            suggestedAction: 'Criar promocao para servicos com baixa demanda',
            metadata: JSON.parse(JSON.stringify({ services: lowDemandServices })),
          },
        });
      }
    }

    // 3. Check inactive clients
    const inactiveCount = await this.getInactiveClientsCount(businessId);
    if (inactiveCount > 5) {
      const existing = await prisma.marketingSuggestion.findFirst({
        where: {
          businessId,
          type: 'INACTIVE_SEGMENT',
          isActioned: false,
          createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await prisma.marketingSuggestion.create({
          data: {
            businessId,
            type: 'INACTIVE_SEGMENT',
            title: `${inactiveCount} clientes inativos`,
            description: `Voce tem ${inactiveCount} clientes que nao visitam ha mais de 60 dias. Uma campanha de reativacao pode trazer esses clientes de volta.`,
            suggestedAction: 'Criar campanha de reativacao',
            metadata: {
              inactiveCount,
            },
          },
        });
      }
    }

    logger.info({ businessId, suggestions: idleSlots.length + lowDemandServices.length }, 'Marketing suggestions generated');
  }

  /**
   * Get suggestions for a business
   */
  async getSuggestions(businessId: string, includeRead = false) {
    const where: any = { businessId };
    if (!includeRead) {
      where.isRead = false;
    }

    return prisma.marketingSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Mark suggestion as read
   */
  async markAsRead(businessId: string, id: string) {
    return prisma.marketingSuggestion.updateMany({
      where: { id, businessId },
      data: { isRead: true },
    });
  }

  /**
   * Mark suggestion as actioned
   */
  async markAsActioned(businessId: string, id: string) {
    return prisma.marketingSuggestion.updateMany({
      where: { id, businessId },
      data: { isActioned: true },
    });
  }

  /**
   * Dismiss suggestion
   */
  async dismiss(businessId: string, id: string) {
    return prisma.marketingSuggestion.updateMany({
      where: { id, businessId },
      data: { dismissedAt: new Date() },
    });
  }

  /**
   * Get suggestion counts
   */
  async getCounts(businessId: string) {
    const [total, unread, actioned] = await Promise.all([
      prisma.marketingSuggestion.count({ where: { businessId } }),
      prisma.marketingSuggestion.count({ where: { businessId, isRead: false, dismissedAt: null } }),
      prisma.marketingSuggestion.count({ where: { businessId, isActioned: true } }),
    ]);

    return { total, unread, actioned };
  }
}

export const suggestionsService = new MarketingSuggestionsService();
