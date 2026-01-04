import { prisma, logger } from '../../config';
import { AppError } from '../../common/errors';

interface CreateServiceDTO {
  businessId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  professionalIds?: string[];
}

interface UpdateServiceDTO {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  isActive?: boolean;
  professionalIds?: string[];
}

export class ServicesService {
  /**
   * Create new service
   */
  async create(data: CreateServiceDTO): Promise<any> {
    // Check if service with same name exists
    const existing = await prisma.service.findFirst({
      where: {
        businessId: data.businessId,
        name: { equals: data.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new AppError('Já existe um serviço com este nome', 409);
    }

    const service = await prisma.service.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: String(data.price),
        isActive: true,
        ...(data.professionalIds && {
          professionals: {
            createMany: {
              data: data.professionalIds.map(id => ({
                professionalId: id,
              })),
            },
          },
        }),
      },
      include: {
        professionals: {
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    logger.info({ businessId: data.businessId, serviceId: service.id }, 'Service created');

    return service;
  }

  /**
   * Get all services for a business
   */
  async getAll(businessId: string, includeInactive = false): Promise<any[]> {
    const services = await prisma.service.findMany({
      where: {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        professionals: {
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            appointments: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return services;
  }

  /**
   * Get service by ID
   */
  async getById(id: string): Promise<any> {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        professionals: {
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                color: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new AppError('Serviço não encontrado', 404);
    }

    return service;
  }

  /**
   * Update service
   */
  async update(id: string, data: UpdateServiceDTO): Promise<any> {
    // Check if changing name and new name already exists
    if (data.name) {
      const service = await prisma.service.findUnique({ where: { id } });
      if (service) {
        const existing = await prisma.service.findFirst({
          where: {
            businessId: service.businessId,
            name: { equals: data.name, mode: 'insensitive' },
            id: { not: id },
          },
        });

        if (existing) {
          throw new AppError('Já existe um serviço com este nome', 409);
        }
      }
    }

    // If updating professionals, delete existing and recreate
    if (data.professionalIds !== undefined) {
      await prisma.serviceProfessional.deleteMany({
        where: { serviceId: id },
      });
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.duration && { duration: data.duration }),
        ...(data.price !== undefined && { price: String(data.price) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.professionalIds && {
          professionals: {
            createMany: {
              data: data.professionalIds.map(professionalId => ({
                professionalId,
              })),
            },
          },
        }),
      },
      include: {
        professionals: {
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    logger.info({ serviceId: id }, 'Service updated');

    return service;
  }

  /**
   * Delete service (soft delete)
   */
  async delete(id: string): Promise<void> {
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info({ serviceId: id }, 'Service deleted');
  }

  /**
   * Get services by professional
   */
  async getByProfessional(professionalId: string): Promise<any[]> {
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        professionals: {
          some: {
            professionalId,
          },
        },
      },
      include: {
        professionals: {
          where: { professionalId },
          select: {
            customDuration: true,
            customPrice: true,
          },
        },
      },
    });

    // Apply custom duration/price if set
    return services.map(service => ({
      ...service,
      duration: service.professionals[0]?.customDuration || service.duration,
      price: service.professionals[0]?.customPrice || service.price,
    }));
  }

  /**
   * Assign professionals to service
   */
  async assignProfessionals(
    serviceId: string,
    professionalIds: string[]
  ): Promise<void> {
    // Delete existing assignments
    await prisma.serviceProfessional.deleteMany({
      where: { serviceId },
    });

    // Create new assignments
    await prisma.serviceProfessional.createMany({
      data: professionalIds.map(professionalId => ({
        serviceId,
        professionalId,
      })),
    });

    logger.info({ serviceId, professionalIds }, 'Professionals assigned to service');
  }
}

export const servicesService = new ServicesService();
