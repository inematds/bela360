import { z } from 'zod';
import { Queue } from 'bullmq';
import { prisma, logger, bullmqConnection } from '../../config';
import { AppError } from '../../common/errors';
import { CampaignStatus, ClientSegmentType } from '@prisma/client';

// Campaign message queue - same as in marketing.worker.ts
const campaignMessageQueue = new Queue('campaign-message', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(3),
  segmentType: z.nativeEnum(ClientSegmentType),
  message: z.string().min(10),
  scheduledFor: z.string().datetime().optional(),
  customFilter: z.object({
    minVisits: z.number().optional(),
    minSpent: z.number().optional(),
    lastVisitDays: z.number().optional(),
    services: z.array(z.string()).optional(),
    professionals: z.array(z.string()).optional(),
  }).optional(),
});

const clientRatingSchema = z.object({
  clientId: z.string().cuid(),
  appointmentId: z.string().cuid(),
  professionalId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export class MarketingService {
  /**
   * Create a marketing campaign
   */
  async createCampaign(businessId: string, data: z.infer<typeof createCampaignSchema>) {
    const validated = createCampaignSchema.parse(data);

    // Get target clients based on segment
    const targetClients = await this.getSegmentClients(businessId, validated.segmentType, validated.customFilter);

    const campaign = await prisma.campaign.create({
      data: {
        businessId,
        name: validated.name,
        segmentType: validated.segmentType,
        message: validated.message,
        scheduledFor: validated.scheduledFor ? new Date(validated.scheduledFor) : null,
        status: validated.scheduledFor ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        totalRecipients: targetClients.length,
        customFilter: validated.customFilter,
        recipients: {
          create: targetClients.map(client => ({
            clientId: client.id,
          })),
        },
      },
      include: {
        _count: { select: { recipients: true } },
      },
    });

    logger.info({ campaignId: campaign.id, recipients: targetClients.length }, 'Campaign created');
    return campaign;
  }

  /**
   * Get clients by segment
   */
  async getSegmentClients(
    businessId: string,
    segment: ClientSegmentType,
    customFilter?: z.infer<typeof createCampaignSchema>['customFilter']
  ) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const where: any = { businessId };

    switch (segment) {
      case ClientSegmentType.ALL:
        // No additional filters
        break;

      case ClientSegmentType.NEW:
        // Clients created in the last 30 days
        where.createdAt = { gte: thirtyDaysAgo };
        break;

      case ClientSegmentType.LOYAL:
        // Clients with 5+ visits
        where.totalAppointments = { gte: 5 };
        break;

      case ClientSegmentType.INACTIVE:
        // Clients with no visit in 60+ days
        where.lastVisitAt = { lt: sixtyDaysAgo };
        break;

      case ClientSegmentType.VIP:
        // Top 10% by spending - get threshold first
        const vipThreshold = await this.getVIPThreshold(businessId);
        where.totalSpent = { gte: vipThreshold };
        break;

      case ClientSegmentType.BIRTHDAY_MONTH:
        // Clients with birthday this month - will filter in code
        where.birthDate = { not: null };
        break;

      case ClientSegmentType.RECURRING:
        // 2-4 visits in recent period
        where.totalAppointments = { gte: 2, lte: 4 };
        break;

      case ClientSegmentType.CUSTOM:
        // Apply custom filters
        if (customFilter) {
          if (customFilter.minVisits) {
            where.totalAppointments = { gte: customFilter.minVisits };
          }
          if (customFilter.minSpent) {
            where.totalSpent = { gte: customFilter.minSpent };
          }
          if (customFilter.lastVisitDays) {
            const daysAgo = new Date(now.getTime() - customFilter.lastVisitDays * 24 * 60 * 60 * 1000);
            where.lastVisitAt = { lt: daysAgo };
          }
        }
        break;
    }

    let clients = await prisma.client.findMany({
      where,
      select: { id: true, name: true, phone: true, birthDate: true },
    });

    // Filter birthday month in code
    if (segment === ClientSegmentType.BIRTHDAY_MONTH) {
      const currentMonth = now.getMonth();
      clients = clients.filter(c => c.birthDate && c.birthDate.getMonth() === currentMonth);
    }

    return clients;
  }

  /**
   * Get VIP threshold (top 10% spending)
   */
  private async getVIPThreshold(businessId: string): Promise<number> {
    const clients = await prisma.client.findMany({
      where: { businessId },
      select: { totalSpent: true },
      orderBy: { totalSpent: 'desc' },
    });

    if (clients.length === 0) return 0;

    const top10Index = Math.floor(clients.length * 0.1);
    return Number(clients[top10Index]?.totalSpent || 0);
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(businessId: string, filters?: { status?: CampaignStatus }) {
    const where: any = { businessId };
    if (filters?.status) where.status = filters.status;

    return prisma.campaign.findMany({
      where,
      include: {
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get campaign by ID with recipients
   */
  async getCampaignById(businessId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, businessId },
      include: {
        recipients: {
          include: {
            client: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campanha não encontrada', 404);
    }

    return campaign;
  }

  /**
   * Update campaign
   */
  async updateCampaign(businessId: string, id: string, data: Partial<z.infer<typeof createCampaignSchema>>) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, businessId },
    });

    if (!campaign) {
      throw new AppError('Campanha não encontrada', 404);
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new AppError('Não é possível editar campanha já iniciada', 400);
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.message) updateData.message = data.message;
    if (data.scheduledFor) updateData.scheduledFor = new Date(data.scheduledFor);

    return prisma.campaign.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(businessId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, businessId },
    });

    if (!campaign) {
      throw new AppError('Campanha não encontrada', 404);
    }

    if (campaign.status === CampaignStatus.SENDING) {
      throw new AppError('Não é possível excluir campanha em envio', 400);
    }

    // Delete recipients first
    await prisma.campaignRecipient.deleteMany({
      where: { campaignId: id },
    });

    return prisma.campaign.delete({ where: { id } });
  }

  /**
   * Start campaign sending
   */
  async startCampaign(businessId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, businessId },
    });

    if (!campaign) {
      throw new AppError('Campanha não encontrada', 404);
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new AppError('Campanha já foi iniciada', 400);
    }

    // Update campaign status to SENDING
    await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.SENDING,
        startedAt: new Date(),
      },
    });

    // Get all recipients that haven't been sent
    const recipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId: id,
        sentAt: null,
        failed: false,
      },
      select: { id: true },
    });

    // Queue each recipient message with delay between batches
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const delay = Math.floor(i / 20) * 60000; // 1 minute delay every 20 messages

      await campaignMessageQueue.add(
        `campaign-${id}-${recipient.id}`,
        {
          campaignId: id,
          recipientId: recipient.id,
          businessId,
        },
        { delay }
      );
    }

    logger.info({ campaignId: id, recipientCount: recipients.length }, 'Campaign started and messages queued');

    return this.getCampaignById(businessId, id);
  }

  /**
   * Update recipient status after sending
   */
  async updateRecipientStatus(
    recipientId: string,
    success: boolean,
    failedReason?: string
  ) {
    const recipient = await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: {
        sentAt: success ? new Date() : undefined,
        failed: !success,
        failedReason,
      },
    });

    // Update campaign counters
    const campaign = await prisma.campaign.findUnique({
      where: { id: recipient.campaignId },
    });

    if (campaign) {
      const updateData: any = {};
      if (success) {
        updateData.sentCount = { increment: 1 };
      } else {
        updateData.failedCount = { increment: 1 };
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: updateData,
      });

      // Check if campaign is complete
      const totalProcessed = (campaign.sentCount || 0) + (campaign.failedCount || 0) + 1;
      if (totalProcessed >= campaign.totalRecipients) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: CampaignStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
      }
    }

    return recipient;
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(businessId: string) {
    const [total, byStatus, recentCampaigns] = await Promise.all([
      prisma.campaign.count({ where: { businessId } }),
      prisma.campaign.groupBy({
        by: ['status'],
        where: { businessId },
        _count: true,
      }),
      prisma.campaign.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          totalRecipients: true,
          sentCount: true,
          failedCount: true,
          createdAt: true,
        },
      }),
    ]);

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byStatus: statusMap,
      recentCampaigns,
    };
  }

  /**
   * Register client rating/review
   */
  async registerRating(businessId: string, data: z.infer<typeof clientRatingSchema>) {
    const validated = clientRatingSchema.parse(data);

    // Verify client belongs to business
    const client = await prisma.client.findFirst({
      where: { id: validated.clientId, businessId },
    });

    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Check for existing rating for same appointment
    const existing = await prisma.clientRating.findUnique({
      where: { appointmentId: validated.appointmentId },
    });

    if (existing) {
      throw new AppError('Avaliação já registrada para este atendimento', 409);
    }

    const rating = await prisma.clientRating.create({
      data: {
        businessId,
        clientId: validated.clientId,
        appointmentId: validated.appointmentId,
        professionalId: validated.professionalId,
        rating: validated.rating,
        comment: validated.comment,
      },
    });

    logger.info({ ratingId: rating.id, clientId: validated.clientId }, 'Rating registered');
    return rating;
  }

  /**
   * Get ratings for business
   */
  async getRatings(businessId: string, filters?: {
    clientId?: string;
    professionalId?: string;
    minRating?: number;
    maxRating?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { businessId };

    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.professionalId) where.professionalId = filters.professionalId;
    if (filters?.minRating || filters?.maxRating) {
      where.rating = {};
      if (filters.minRating) where.rating.gte = filters.minRating;
      if (filters.maxRating) where.rating.lte = filters.maxRating;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return prisma.clientRating.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        appointment: {
          select: {
            id: true,
            startTime: true,
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get rating statistics
   */
  async getRatingStats(businessId: string) {
    const [overall, distribution, byProfessional] = await Promise.all([
      prisma.clientRating.aggregate({
        where: { businessId },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.clientRating.groupBy({
        by: ['rating'],
        where: { businessId },
        _count: true,
      }),
      prisma.clientRating.groupBy({
        by: ['professionalId'],
        where: { businessId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    // Get professional names
    const professionalIds = byProfessional.map(p => p.professionalId);
    const professionals = await prisma.user.findMany({
      where: { id: { in: professionalIds } },
      select: { id: true, name: true },
    });

    const byProfessionalWithNames = byProfessional.map(p => ({
      ...p,
      professional: professionals.find(prof => prof.id === p.professionalId),
    }));

    const distributionMap = distribution.reduce((acc, item) => {
      acc[item.rating] = item._count;
      return acc;
    }, {} as Record<number, number>);

    return {
      averageRating: overall._avg.rating || 0,
      totalRatings: overall._count,
      distribution: {
        1: distributionMap[1] || 0,
        2: distributionMap[2] || 0,
        3: distributionMap[3] || 0,
        4: distributionMap[4] || 0,
        5: distributionMap[5] || 0,
      },
      byProfessional: byProfessionalWithNames,
    };
  }

  /**
   * Get client segments overview
   */
  async getSegmentsOverview(businessId: string) {
    const segments = await Promise.all([
      this.getSegmentClients(businessId, ClientSegmentType.ALL),
      this.getSegmentClients(businessId, ClientSegmentType.NEW),
      this.getSegmentClients(businessId, ClientSegmentType.LOYAL),
      this.getSegmentClients(businessId, ClientSegmentType.INACTIVE),
      this.getSegmentClients(businessId, ClientSegmentType.VIP),
      this.getSegmentClients(businessId, ClientSegmentType.BIRTHDAY_MONTH),
      this.getSegmentClients(businessId, ClientSegmentType.RECURRING),
    ]);

    return {
      all: segments[0].length,
      new: segments[1].length,
      loyal: segments[2].length,
      inactive: segments[3].length,
      vip: segments[4].length,
      birthdayMonth: segments[5].length,
      recurring: segments[6].length,
    };
  }
}

export const marketingService = new MarketingService();
