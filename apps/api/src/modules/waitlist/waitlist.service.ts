import { z } from 'zod';
import { prisma, logger } from '../../config';
import { AppError } from '../../common/errors';
import { WaitlistStatus, DayPeriod } from '@prisma/client';

// Validation schemas
const createWaitlistSchema = z.object({
  clientId: z.string().cuid(),
  serviceId: z.string().cuid(),
  professionalId: z.string().cuid().optional(),
  desiredDate: z.string().transform(s => new Date(s)),
  desiredPeriod: z.nativeEnum(DayPeriod).optional(),
});

export class WaitlistService {
  /**
   * Add client to waitlist
   */
  async add(businessId: string, data: z.infer<typeof createWaitlistSchema>) {
    const validated = createWaitlistSchema.parse(data);

    // Check if client is already in waitlist for same date/service
    const existing = await prisma.waitlist.findFirst({
      where: {
        businessId,
        clientId: validated.clientId,
        serviceId: validated.serviceId,
        desiredDate: validated.desiredDate,
        status: WaitlistStatus.WAITING,
      },
    });

    if (existing) {
      throw new AppError('Cliente já está na lista de espera para esta data', 409);
    }

    // Check client's active waitlist count (max 3)
    const activeCount = await prisma.waitlist.count({
      where: {
        clientId: validated.clientId,
        status: WaitlistStatus.WAITING,
      },
    });

    if (activeCount >= 3) {
      throw new AppError('Cliente já está em 3 listas de espera', 400);
    }

    const entry = await prisma.waitlist.create({
      data: {
        businessId,
        ...validated,
        desiredPeriod: validated.desiredPeriod || DayPeriod.ANY,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, duration: true } },
        professional: { select: { id: true, name: true } },
      },
    });

    logger.info({ entryId: entry.id, clientId: validated.clientId }, 'Client added to waitlist');
    return entry;
  }

  /**
   * Get waitlist for a business
   */
  async getAll(businessId: string, filters?: { date?: Date; status?: WaitlistStatus }) {
    const where: any = { businessId };

    if (filters?.date) {
      where.desiredDate = filters.date;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.waitlist.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
        professional: { select: { id: true, name: true } },
      },
      orderBy: [{ desiredDate: 'asc' }, { priority: 'asc' }],
    });
  }

  /**
   * Get waitlist entry by ID
   */
  async getById(businessId: string, id: string) {
    const entry = await prisma.waitlist.findFirst({
      where: { id, businessId },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, duration: true } },
        professional: { select: { id: true, name: true } },
      },
    });

    if (!entry) {
      throw new AppError('Entrada não encontrada na lista de espera', 404);
    }

    return entry;
  }

  /**
   * Remove from waitlist
   */
  async remove(businessId: string, id: string) {
    const entry = await prisma.waitlist.findFirst({
      where: { id, businessId },
    });

    if (!entry) {
      throw new AppError('Entrada não encontrada na lista de espera', 404);
    }

    await prisma.waitlist.update({
      where: { id },
      data: { status: WaitlistStatus.CANCELLED },
    });

    logger.info({ entryId: id }, 'Waitlist entry cancelled');
  }

  /**
   * Check waitlist when slot becomes available (appointment cancelled)
   */
  async checkForSlotAvailability(businessId: string, appointmentDate: Date, professionalId: string, _serviceId?: string) {
    const date = new Date(appointmentDate);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const hour = date.getHours();

    // Determine period
    let period: DayPeriod;
    if (hour >= 6 && hour < 12) {
      period = DayPeriod.MORNING;
    } else if (hour >= 12 && hour < 18) {
      period = DayPeriod.AFTERNOON;
    } else {
      period = DayPeriod.EVENING;
    }

    // Find matching waitlist entries
    const entries = await prisma.waitlist.findMany({
      where: {
        businessId,
        desiredDate: dateOnly,
        status: WaitlistStatus.WAITING,
        OR: [
          { desiredPeriod: period },
          { desiredPeriod: DayPeriod.ANY },
        ],
        AND: [
          {
            OR: [
              { professionalId: professionalId },
              { professionalId: null },
            ],
          },
        ],
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { priority: 'asc' },
    });

    if (entries.length === 0) {
      logger.info({ businessId, date: dateOnly }, 'No waitlist entries for available slot');
      return null;
    }

    // Get first in queue
    const firstEntry = entries[0];

    // Mark as notified
    await prisma.waitlist.update({
      where: { id: firstEntry.id },
      data: {
        status: WaitlistStatus.NOTIFIED,
        notifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    logger.info({ entryId: firstEntry.id, clientId: firstEntry.clientId }, 'Client notified of available slot');

    return {
      entry: firstEntry,
      slotTime: date,
    };
  }

  /**
   * Convert waitlist entry to appointment
   */
  async convert(businessId: string, id: string, appointmentId: string) {
    const entry = await prisma.waitlist.findFirst({
      where: { id, businessId },
    });

    if (!entry) {
      throw new AppError('Entrada não encontrada na lista de espera', 404);
    }

    await prisma.waitlist.update({
      where: { id },
      data: {
        status: WaitlistStatus.CONVERTED,
        convertedAppointmentId: appointmentId,
      },
    });

    logger.info({ entryId: id, appointmentId }, 'Waitlist entry converted to appointment');
  }

  /**
   * Expire old notified entries
   */
  async expireNotified() {
    const result = await prisma.waitlist.updateMany({
      where: {
        status: WaitlistStatus.NOTIFIED,
        expiresAt: { lt: new Date() },
      },
      data: { status: WaitlistStatus.EXPIRED },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Expired waitlist notifications');
    }

    return result.count;
  }

  /**
   * Get waitlist stats
   */
  async getStats(businessId: string) {
    const [waiting, notified, converted, expired] = await Promise.all([
      prisma.waitlist.count({ where: { businessId, status: WaitlistStatus.WAITING } }),
      prisma.waitlist.count({ where: { businessId, status: WaitlistStatus.NOTIFIED } }),
      prisma.waitlist.count({ where: { businessId, status: WaitlistStatus.CONVERTED } }),
      prisma.waitlist.count({ where: { businessId, status: WaitlistStatus.EXPIRED } }),
    ]);

    const total = waiting + notified + converted + expired;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      waiting,
      notified,
      converted,
      expired,
      total,
      conversionRate,
    };
  }

  /**
   * Get waitlist by date for demand analysis
   */
  async getDemandByDate(businessId: string, startDate: Date, endDate: Date) {
    const entries = await prisma.waitlist.groupBy({
      by: ['desiredDate'],
      where: {
        businessId,
        desiredDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return entries.map(e => ({
      date: e.desiredDate,
      count: e._count,
    }));
  }

  /**
   * Notify next in queue after timeout
   */
  async notifyNext(businessId: string, expiredEntryId: string) {
    const expiredEntry = await prisma.waitlist.findFirst({
      where: { id: expiredEntryId, businessId },
    });

    if (!expiredEntry) return null;

    // Find next waiting entry for same date/period
    const nextEntry = await prisma.waitlist.findFirst({
      where: {
        businessId,
        desiredDate: expiredEntry.desiredDate,
        status: WaitlistStatus.WAITING,
        id: { not: expiredEntryId },
        OR: [
          { desiredPeriod: expiredEntry.desiredPeriod },
          { desiredPeriod: DayPeriod.ANY },
        ],
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { priority: 'asc' },
    });

    if (!nextEntry) return null;

    await prisma.waitlist.update({
      where: { id: nextEntry.id },
      data: {
        status: WaitlistStatus.NOTIFIED,
        notifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    logger.info({ entryId: nextEntry.id }, 'Next waitlist client notified');
    return nextEntry;
  }
}

export const waitlistService = new WaitlistService();
