import { prisma, logger } from '../../config';
import { AppError } from '../../common/errors';

interface CreateClientDTO {
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: Date;
  notes?: string;
  preferredProfessionalId?: string;
}

interface UpdateClientDTO {
  name?: string;
  phone?: string;
  email?: string;
  birthDate?: Date;
  notes?: string;
  preferredProfessionalId?: string;
}

interface ClientFilters {
  search?: string;
  hasAppointments?: boolean;
  lastVisitAfter?: Date;
  lastVisitBefore?: Date;
}

export class ClientsService {
  /**
   * Create or get existing client
   */
  async createOrGet(data: CreateClientDTO): Promise<any> {
    const normalizedPhone = data.phone.replace(/\D/g, '');

    // Check if client exists
    let client = await prisma.client.findFirst({
      where: {
        businessId: data.businessId,
        phone: normalizedPhone,
      },
    });

    if (client) {
      // Update name if it was auto-generated
      if (client.name === 'Novo Cliente' && data.name !== 'Novo Cliente') {
        client = await prisma.client.update({
          where: { id: client.id },
          data: { name: data.name },
        });
      }
      return client;
    }

    // Create new client
    client = await prisma.client.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        phone: normalizedPhone,
        email: data.email,
        birthDate: data.birthDate,
        notes: data.notes,
        preferredProfessionalId: data.preferredProfessionalId,
      },
    });

    logger.info({ businessId: data.businessId, clientId: client.id }, 'Client created');

    return client;
  }

  /**
   * Get all clients for a business
   */
  async getAll(
    businessId: string,
    filters: ClientFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ clients: any[]; total: number; pages: number }> {
    const where: any = { businessId };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search.replace(/\D/g, '') } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.hasAppointments === true) {
      where.totalAppointments = { gt: 0 };
    } else if (filters.hasAppointments === false) {
      where.totalAppointments = 0;
    }

    if (filters.lastVisitAfter) {
      where.lastVisitAt = { gte: filters.lastVisitAfter };
    }

    if (filters.lastVisitBefore) {
      where.lastVisitAt = {
        ...where.lastVisitAt,
        lte: filters.lastVisitBefore,
      };
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          appointments: {
            take: 5,
            orderBy: { startTime: 'desc' },
            include: {
              service: { select: { name: true } },
              professional: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get client by ID with full history
   */
  async getById(id: string): Promise<any> {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          include: {
            service: true,
            professional: { select: { id: true, name: true, color: true } },
          },
        },
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    return client;
  }

  /**
   * Get client by phone
   */
  async getByPhone(businessId: string, phone: string): Promise<any> {
    const normalizedPhone = phone.replace(/\D/g, '');

    const client = await prisma.client.findFirst({
      where: {
        businessId,
        phone: normalizedPhone,
      },
    });

    return client;
  }

  /**
   * Update client
   */
  async update(id: string, data: UpdateClientDTO): Promise<any> {
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone.replace(/\D/g, '') }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.preferredProfessionalId !== undefined && {
          preferredProfessionalId: data.preferredProfessionalId,
        }),
      },
    });

    return client;
  }

  /**
   * Delete client (hard delete - GDPR compliance)
   */
  async delete(id: string): Promise<void> {
    // First delete related data
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { clientId: id } }),
      prisma.appointment.deleteMany({ where: { clientId: id } }),
      prisma.client.delete({ where: { id } }),
    ]);

    logger.info({ clientId: id }, 'Client deleted');
  }

  /**
   * Update client stats after appointment
   */
  async updateStats(clientId: string): Promise<void> {
    const appointments = await prisma.appointment.findMany({
      where: {
        clientId,
        status: 'COMPLETED',
      },
      include: {
        service: true,
      },
      orderBy: { startTime: 'desc' },
    });

    const totalAppointments = appointments.length;
    const totalSpent = appointments.reduce(
      (sum, app) => sum + Number(app.service.price),
      0
    );
    const lastVisitAt = appointments[0]?.startTime || null;

    await prisma.client.update({
      where: { id: clientId },
      data: {
        totalAppointments,
        totalSpent: String(totalSpent),
        lastVisitAt,
      },
    });
  }

  /**
   * Get clients with birthday in date range
   */
  async getUpcomingBirthdays(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const clients = await prisma.client.findMany({
      where: {
        businessId,
        birthDate: { not: null },
      },
    });

    // Filter by birthday in range
    return clients.filter(client => {
      if (!client.birthDate) return false;

      const birthday = new Date(client.birthDate);
      const thisYearBirthday = new Date(
        startDate.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      );

      return thisYearBirthday >= startDate && thisYearBirthday <= endDate;
    });
  }

  /**
   * Get inactive clients (no visit in X days)
   */
  async getInactiveClients(businessId: string, inactiveDays = 60): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const clients = await prisma.client.findMany({
      where: {
        businessId,
        totalAppointments: { gt: 0 },
        lastVisitAt: { lt: cutoffDate },
      },
      orderBy: { lastVisitAt: 'asc' },
    });

    return clients;
  }
}

export const clientsService = new ClientsService();
