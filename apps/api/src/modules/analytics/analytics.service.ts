import { prisma, logger } from '../../config';
import { sendQueue } from '../whatsapp/whatsapp.queue';

interface DashboardStats {
  today: {
    appointments: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    revenue: number;
  };
  week: {
    appointments: number;
    newClients: number;
    revenue: number;
  };
  month: {
    appointments: number;
    newClients: number;
    revenue: number;
    topServices: Array<{ name: string; count: number }>;
  };
  confirmationRate: number;
  averageTicket: number;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(businessId: string): Promise<DashboardStats> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Today's stats
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: todayStart, lte: todayEnd },
      },
      include: { service: true },
    });

    const todayStats = {
      appointments: todayAppointments.length,
      confirmed: todayAppointments.filter(a => a.status === 'CONFIRMED').length,
      cancelled: todayAppointments.filter(a => a.status === 'CANCELLED').length,
      completed: todayAppointments.filter(a => a.status === 'COMPLETED').length,
      revenue: todayAppointments
        .filter(a => a.status === 'COMPLETED')
        .reduce((sum, a) => sum + Number(a.service.price), 0),
    };

    // Week stats
    const weekAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: weekStart },
        status: 'COMPLETED',
      },
      include: { service: true },
    });

    const weekNewClients = await prisma.client.count({
      where: {
        businessId,
        createdAt: { gte: weekStart },
      },
    });

    const weekStats = {
      appointments: weekAppointments.length,
      newClients: weekNewClients,
      revenue: weekAppointments.reduce((sum, a) => sum + Number(a.service.price), 0),
    };

    // Month stats
    const monthAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: monthStart },
        status: 'COMPLETED',
      },
      include: { service: true },
    });

    const monthNewClients = await prisma.client.count({
      where: {
        businessId,
        createdAt: { gte: monthStart },
      },
    });

    // Top services this month
    const serviceCount = new Map<string, { name: string; count: number }>();
    monthAppointments.forEach(a => {
      const current = serviceCount.get(a.serviceId) || { name: a.service.name, count: 0 };
      serviceCount.set(a.serviceId, { ...current, count: current.count + 1 });
    });
    const topServices = Array.from(serviceCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const monthStats = {
      appointments: monthAppointments.length,
      newClients: monthNewClients,
      revenue: monthAppointments.reduce((sum, a) => sum + Number(a.service.price), 0),
      topServices,
    };

    // Confirmation rate (last 30 days)
    const last30DaysStart = new Date(now);
    last30DaysStart.setDate(last30DaysStart.getDate() - 30);

    const [totalAppointments, confirmedAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          businessId,
          startTime: { gte: last30DaysStart },
          status: { in: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
        },
      }),
      prisma.appointment.count({
        where: {
          businessId,
          startTime: { gte: last30DaysStart },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      }),
    ]);

    const confirmationRate = totalAppointments > 0
      ? Math.round((confirmedAppointments / totalAppointments) * 100)
      : 0;

    // Average ticket
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: monthStart },
        status: 'COMPLETED',
      },
      include: { service: true },
    });

    const averageTicket = completedAppointments.length > 0
      ? completedAppointments.reduce((sum, a) => sum + Number(a.service.price), 0) /
        completedAppointments.length
      : 0;

    return {
      today: todayStats,
      week: weekStats,
      month: monthStats,
      confirmationRate,
      averageTicket: Math.round(averageTicket * 100) / 100,
    };
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(
    businessId: string,
    range: DateRange
  ): Promise<{ daily: Array<{ date: string; revenue: number; count: number }> }> {
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: range.startDate, lte: range.endDate },
        status: 'COMPLETED',
      },
      include: { service: true },
      orderBy: { startTime: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<string, { revenue: number; count: number }>();

    appointments.forEach(a => {
      const date = a.startTime.toISOString().split('T')[0];
      const current = dailyMap.get(date) || { revenue: 0, count: 0 };
      dailyMap.set(date, {
        revenue: current.revenue + Number(a.service.price),
        count: current.count + 1,
      });
    });

    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    return { daily };
  }

  /**
   * Get service performance report
   */
  async getServiceReport(businessId: string, range: DateRange): Promise<any[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: range.startDate, lte: range.endDate },
        status: 'COMPLETED',
      },
      include: { service: true },
    });

    const serviceMap = new Map<
      string,
      { id: string; name: string; count: number; revenue: number }
    >();

    appointments.forEach(a => {
      const current = serviceMap.get(a.serviceId) || {
        id: a.serviceId,
        name: a.service.name,
        count: 0,
        revenue: 0,
      };
      serviceMap.set(a.serviceId, {
        ...current,
        count: current.count + 1,
        revenue: current.revenue + Number(a.service.price),
      });
    });

    return Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get professional performance report
   */
  async getProfessionalReport(businessId: string, range: DateRange): Promise<any[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: range.startDate, lte: range.endDate },
        status: 'COMPLETED',
      },
      include: {
        service: true,
        professional: { select: { id: true, name: true } },
      },
    });

    const profMap = new Map<
      string,
      { id: string; name: string; appointments: number; revenue: number }
    >();

    appointments.forEach(a => {
      const current = profMap.get(a.professionalId) || {
        id: a.professionalId,
        name: a.professional.name,
        appointments: 0,
        revenue: 0,
      };
      profMap.set(a.professionalId, {
        ...current,
        appointments: current.appointments + 1,
        revenue: current.revenue + Number(a.service.price),
      });
    });

    return Array.from(profMap.values()).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get client retention report
   */
  async getClientRetentionReport(businessId: string): Promise<{
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    newThisMonth: number;
    retentionRate: number;
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalClients, activeClients, inactiveClients, newThisMonth] = await Promise.all([
      prisma.client.count({ where: { businessId } }),
      prisma.client.count({
        where: { businessId, lastVisitAt: { gte: thirtyDaysAgo } },
      }),
      prisma.client.count({
        where: {
          businessId,
          totalAppointments: { gt: 0 },
          lastVisitAt: { lt: sixtyDaysAgo },
        },
      }),
      prisma.client.count({
        where: { businessId, createdAt: { gte: monthStart } },
      }),
    ]);

    // Retention rate: clients who visited last month and also this month
    const clientsWithRecentVisits = await prisma.client.count({
      where: {
        businessId,
        lastVisitAt: { gte: thirtyDaysAgo },
        appointments: {
          some: {
            startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
            status: 'COMPLETED',
          },
        },
      },
    });

    const clientsLastMonth = await prisma.client.count({
      where: {
        businessId,
        appointments: {
          some: {
            startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
            status: 'COMPLETED',
          },
        },
      },
    });

    const retentionRate = clientsLastMonth > 0
      ? Math.round((clientsWithRecentVisits / clientsLastMonth) * 100)
      : 0;

    return {
      totalClients,
      activeClients,
      inactiveClients,
      newThisMonth,
      retentionRate,
    };
  }

  /**
   * Update daily stats (called by cron job)
   */
  async updateDailyStats(businessId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: { service: true },
    });

    const newClients = await prisma.client.count({
      where: {
        businessId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const returningClients = await prisma.client.count({
      where: {
        businessId,
        totalAppointments: { gt: 1 },
        appointments: {
          some: {
            startTime: { gte: startOfDay, lte: endOfDay },
          },
        },
      },
    });

    const messages = await prisma.message.groupBy({
      by: ['direction'],
      where: {
        businessId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      _count: true,
    });

    const messagesSent = messages.find(m => m.direction === 'OUTBOUND')?._count || 0;
    const messagesReceived = messages.find(m => m.direction === 'INBOUND')?._count || 0;

    await prisma.dailyStats.upsert({
      where: {
        businessId_date: {
          businessId,
          date: startOfDay,
        },
      },
      update: {
        totalAppointments: appointments.length,
        confirmedCount: appointments.filter(a => a.status === 'CONFIRMED').length,
        cancelledCount: appointments.filter(a => a.status === 'CANCELLED').length,
        noShowCount: appointments.filter(a => a.status === 'NO_SHOW').length,
        completedCount: appointments.filter(a => a.status === 'COMPLETED').length,
        totalRevenue: appointments
          .filter(a => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + Number(a.service.price), 0),
        newClients,
        returningClients,
        messagesSent,
        messagesReceived,
      },
      create: {
        businessId,
        date: startOfDay,
        totalAppointments: appointments.length,
        confirmedCount: appointments.filter(a => a.status === 'CONFIRMED').length,
        cancelledCount: appointments.filter(a => a.status === 'CANCELLED').length,
        noShowCount: appointments.filter(a => a.status === 'NO_SHOW').length,
        completedCount: appointments.filter(a => a.status === 'COMPLETED').length,
        totalRevenue: appointments
          .filter(a => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + Number(a.service.price), 0),
        newClients,
        returningClients,
        messagesSent,
        messagesReceived,
      },
    });

    logger.debug({ businessId, date: startOfDay }, 'Daily stats updated');
  }

  /**
   * Send birthday messages
   */
  async sendBirthdayMessages(businessId: string): Promise<number> {
    const today = new Date();
    const clients = await prisma.client.findMany({
      where: {
        businessId,
        birthDate: { not: null },
      },
    });

    let sentCount = 0;

    for (const client of clients) {
      if (!client.birthDate) continue;

      const birthday = new Date(client.birthDate);
      if (
        birthday.getMonth() === today.getMonth() &&
        birthday.getDate() === today.getDate()
      ) {
        const message = `🎂 Feliz Aniversário, ${client.name}! 🎉\n\nDesejamos um dia incrível cheio de alegria!\n\nComo presente, você tem 10% de desconto em qualquer serviço hoje. Use o código NIVER10.\n\nAgende seu horário especial! 💜`;

        await sendQueue.add('send-message', {
          businessId,
          phone: client.phone,
          message,
        });

        sentCount++;
      }
    }

    logger.info({ businessId, sentCount }, 'Birthday messages sent');

    return sentCount;
  }

  /**
   * Send reactivation campaign
   */
  async sendReactivationCampaign(
    businessId: string,
    inactiveDays = 60
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const inactiveClients = await prisma.client.findMany({
      where: {
        businessId,
        totalAppointments: { gt: 0 },
        lastVisitAt: { lt: cutoffDate },
      },
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    let sentCount = 0;

    for (const client of inactiveClients) {
      const message = `Olá ${client.name}! 👋\n\nSentimos sua falta por aqui no ${business?.name}! 💜\n\nFaz tempo que você não nos visita. Que tal agendar um horário?\n\nTemos uma oferta especial esperando por você! 🎁`;

      await sendQueue.add('send-message', {
        businessId,
        phone: client.phone,
        message,
      });

      sentCount++;
    }

    logger.info({ businessId, sentCount, inactiveDays }, 'Reactivation campaign sent');

    return sentCount;
  }
}

export const analyticsService = new AnalyticsService();
