import { prisma, logger } from '../../config';
import { BusinessType, UserRole, DayOfWeek } from '@prisma/client';
import { AppError } from '../../common/errors';

interface CreateBusinessDTO {
  name: string;
  phone: string;
  email?: string;
  type?: BusinessType;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
}

interface UpdateBusinessDTO {
  name?: string;
  email?: string;
  type?: BusinessType;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  settings?: Record<string, any>;
}

interface CreateProfessionalDTO {
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  role?: UserRole;
  color?: string;
  commission?: number;
}

interface SetWorkingHoursDTO {
  businessId: string;
  professionalId?: string;
  hours: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
    isActive: boolean;
  }>;
}

export class BusinessService {
  /**
   * Create new business (onboarding)
   */
  async create(data: CreateBusinessDTO): Promise<any> {
    // Check if phone already exists
    const existingBusiness = await prisma.business.findFirst({
      where: { phone: data.phone.replace(/\D/g, '') },
    });

    if (existingBusiness) {
      throw new AppError('Já existe um estabelecimento com este telefone', 409);
    }

    // Generate slug from name
    const slug = this.generateSlug(data.name);

    // Check if slug exists and make unique if needed
    const existingSlug = await prisma.business.findFirst({
      where: { slug },
    });

    const finalSlug = existingSlug
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    // Create business with owner
    const business = await prisma.business.create({
      data: {
        name: data.name,
        slug: finalSlug,
        phone: data.phone.replace(/\D/g, ''),
        email: data.email,
        type: data.type || 'SALON',
        status: 'PENDING',
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        settings: {
          appointmentBuffer: 15, // minutes between appointments
          maxAdvanceBooking: 30, // days
          minAdvanceBooking: 1, // hours
          allowOnlineBooking: true,
          autoConfirm: false,
          sendReminders: true,
          reminderHours: 24,
        },
        users: {
          create: {
            name: data.ownerName,
            phone: data.ownerPhone.replace(/\D/g, ''),
            email: data.ownerEmail,
            role: 'OWNER',
            isActive: true,
          },
        },
      },
      include: {
        users: true,
      },
    });

    // Create default working hours (Mon-Sat 9:00-18:00)
    const defaultDays: DayOfWeek[] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    await prisma.workingHours.createMany({
      data: defaultDays.map(day => ({
        businessId: business.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        isActive: true,
      })),
    });

    // Create default message templates
    await prisma.messageTemplate.createMany({
      data: [
        {
          businessId: business.id,
          name: 'Boas-vindas',
          type: 'welcome',
          content: `Olá {{client_name}}! 👋\n\nBem-vindo(a) ao {{business_name}}!\n\nComo posso ajudar você hoje?`,
        },
        {
          businessId: business.id,
          name: 'Confirmação de Agendamento',
          type: 'confirmation',
          content: `Olá {{client_name}}! ✅\n\nSeu agendamento foi confirmado:\n\n📅 {{date}} às {{time}}\n💇 {{service}}\n👤 Com {{professional}}\n\nAté lá! 😊`,
        },
        {
          businessId: business.id,
          name: 'Lembrete',
          type: 'reminder',
          content: `Olá {{client_name}}! 👋\n\nLembrete do seu agendamento amanhã:\n\n📅 {{date}} às {{time}}\n💇 {{service}}\n👤 Com {{professional}}\n\nPodemos confirmar sua presença?`,
        },
        {
          businessId: business.id,
          name: 'Cancelamento',
          type: 'cancellation',
          content: `Olá {{client_name}},\n\nSeu agendamento foi cancelado:\n\n📅 {{date}} às {{time}}\n💇 {{service}}\n\nEsperamos vê-lo(a) em breve! 😊`,
        },
      ],
    });

    logger.info({ businessId: business.id }, 'Business created successfully');

    return business;
  }

  /**
   * Get business by ID
   */
  async getById(id: string): Promise<any> {
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        users: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            color: true,
            commission: true,
          },
        },
        services: {
          where: { isActive: true },
        },
        workingHours: {
          where: { professionalId: null, isActive: true },
        },
        _count: {
          select: {
            clients: true,
            appointments: true,
          },
        },
      },
    });

    if (!business) {
      throw new AppError('Estabelecimento não encontrado', 404);
    }

    return business;
  }

  /**
   * Update business
   */
  async update(id: string, data: UpdateBusinessDTO): Promise<any> {
    const business = await prisma.business.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.type && { type: data.type }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.zipCode && { zipCode: data.zipCode }),
        ...(data.settings && { settings: data.settings }),
      },
    });

    return business;
  }

  /**
   * Activate business (after WhatsApp connection)
   */
  async activate(id: string): Promise<any> {
    const business = await prisma.business.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    logger.info({ businessId: id }, 'Business activated');

    return business;
  }

  /**
   * Add professional to business
   */
  async addProfessional(data: CreateProfessionalDTO): Promise<any> {
    // Check if phone already exists in this business
    const existing = await prisma.user.findFirst({
      where: {
        businessId: data.businessId,
        phone: data.phone.replace(/\D/g, ''),
      },
    });

    if (existing) {
      throw new AppError('Já existe um profissional com este telefone', 409);
    }

    const professional = await prisma.user.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        phone: data.phone.replace(/\D/g, ''),
        email: data.email,
        role: data.role || 'PROFESSIONAL',
        color: data.color || this.generateColor(),
        commission: data.commission !== undefined ? String(data.commission) : undefined,
        isActive: true,
      },
    });

    // Copy business working hours for the professional
    const businessHours = await prisma.workingHours.findMany({
      where: {
        businessId: data.businessId,
        professionalId: null,
      },
    });

    if (businessHours.length > 0) {
      await prisma.workingHours.createMany({
        data: businessHours.map(h => ({
          businessId: data.businessId,
          professionalId: professional.id,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          breakStart: h.breakStart,
          breakEnd: h.breakEnd,
          isActive: h.isActive,
        })),
      });
    }

    logger.info(
      { businessId: data.businessId, professionalId: professional.id },
      'Professional added'
    );

    return professional;
  }

  /**
   * Update professional
   */
  async updateProfessional(
    id: string,
    data: Partial<CreateProfessionalDTO>
  ): Promise<any> {
    const professional = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone.replace(/\D/g, '') }),
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role }),
        ...(data.color && { color: data.color }),
        ...(data.commission !== undefined && { commission: String(data.commission) }),
      },
    });

    return professional;
  }

  /**
   * Remove professional (soft delete)
   */
  async removeProfessional(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get professionals for a business
   */
  async getProfessionals(businessId: string): Promise<any[]> {
    const professionals = await prisma.user.findMany({
      where: {
        businessId,
        isActive: true,
        role: { in: ['PROFESSIONAL', 'ADMIN', 'OWNER'] },
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        workingHours: {
          where: { isActive: true },
        },
        _count: {
          select: {
            appointments: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            },
          },
        },
      },
    });

    return professionals;
  }

  /**
   * Set working hours
   */
  async setWorkingHours(data: SetWorkingHoursDTO): Promise<any[]> {
    // Delete existing hours
    await prisma.workingHours.deleteMany({
      where: {
        businessId: data.businessId,
        professionalId: data.professionalId || null,
      },
    });

    // Create new hours
    const hours = await prisma.workingHours.createManyAndReturn({
      data: data.hours.map(h => ({
        businessId: data.businessId,
        professionalId: data.professionalId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
        breakStart: h.breakStart,
        breakEnd: h.breakEnd,
        isActive: h.isActive,
      })),
    });

    logger.info(
      {
        businessId: data.businessId,
        professionalId: data.professionalId,
        count: hours.length,
      },
      'Working hours updated'
    );

    return hours;
  }

  /**
   * Get working hours
   */
  async getWorkingHours(businessId: string, professionalId?: string): Promise<any[]> {
    const hours = await prisma.workingHours.findMany({
      where: {
        businessId,
        professionalId: professionalId || null,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    return hours;
  }

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, '') // Trim dashes
      .slice(0, 50); // Limit length
  }

  /**
   * Generate random color for calendar
   */
  private generateColor(): string {
    const colors = [
      '#7C3AED', // Purple
      '#EC4899', // Pink
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const businessService = new BusinessService();
