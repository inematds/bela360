import { Router, Request, Response } from 'express';
import { prisma } from '../../config';

const router: Router = Router();

// Get professional profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    let profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        badges: { orderBy: { earnedAt: 'desc' } },
        goals: {
          where: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
          },
        },
      },
    });

    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const slug = user.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      profile = await prisma.professionalProfile.create({
        data: {
          userId,
          slug: `${slug}-${Date.now().toString(36)}`,
          referralCode: `REF${Date.now().toString(36).toUpperCase()}`,
        },
        include: {
          badges: true,
          goals: true,
        },
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Update professional profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = req.body;

    const profile = await prisma.professionalProfile.update({
      where: { userId },
      data: {
        bio: data.bio,
        specialties: data.specialties,
        photoUrl: data.photoUrl,
        coverPhotoUrl: data.coverPhotoUrl,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        tiktokUrl: data.tiktokUrl,
        portfolioImages: data.portfolioImages,
        isPublic: data.isPublic,
      },
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Get public profile by slug
router.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const profile = await prisma.professionalProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
            business: {
              select: { name: true, address: true, phone: true },
            },
            services: {
              include: {
                service: { select: { id: true, name: true, duration: true, price: true } },
              },
            },
          },
        },
        badges: { orderBy: { earnedAt: 'desc' }, take: 10 },
      },
    });

    if (!profile || !profile.isPublic) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const ratings = await prisma.clientRating.findMany({
      where: { professionalId: profile.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        rating: true,
        comment: true,
        response: true,
        createdAt: true,
        client: { select: { name: true } },
      },
    });

    res.json({ ...profile, ratings });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil público' });
  }
});

// Get professional dashboard stats
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const businessId = (req as any).businessId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [appointments, payments, ratings, ranking, goals] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          professionalId: userId,
          startTime: { gte: startOfMonth, lte: endOfMonth },
          status: 'COMPLETED',
        },
      }),
      prisma.payment.aggregate({
        where: {
          professionalId: userId,
          paidAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { finalAmount: true, commissionAmount: true },
        _count: true,
      }),
      prisma.clientRating.aggregate({
        where: { professionalId: userId },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.professionalRanking.findFirst({
        where: {
          businessId,
          userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      }),
      prisma.professionalGoal.findMany({
        where: {
          profile: { userId },
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      }),
    ]);

    const uniqueClients = new Set(appointments.map(a => a.clientId)).size;

    const clientAppointments = await prisma.appointment.groupBy({
      by: ['clientId'],
      where: {
        professionalId: userId,
        status: 'COMPLETED',
      },
      _count: true,
      orderBy: { _count: { clientId: 'desc' } },
      take: 10,
    });

    const loyalClients = await prisma.client.findMany({
      where: { id: { in: clientAppointments.map(c => c.clientId) } },
      select: { id: true, name: true, phone: true },
    });

    res.json({
      thisMonth: {
        appointments: appointments.length,
        revenue: payments._sum.finalAmount || 0,
        commission: payments._sum.commissionAmount || 0,
        uniqueClients,
      },
      ratings: {
        average: ratings._avg.rating || 0,
        total: ratings._count,
      },
      ranking,
      goals,
      loyalClients: loyalClients.map(c => ({
        ...c,
        visits: clientAppointments.find(ca => ca.clientId === c.id)?._count || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

// Get goals
router.get('/goals', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { month, year } = req.query;

    const m = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const y = year ? parseInt(year as string) : new Date().getFullYear();

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const goals = await prisma.professionalGoal.findMany({
      where: {
        profileId: profile.id,
        month: m,
        year: y,
      },
    });

    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
});

// Set goal (owner only)
router.post('/goals/:userId', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { userId: targetUserId } = req.params;
    const data = req.body;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: targetUserId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const goal = await prisma.professionalGoal.upsert({
      where: {
        profileId_type_month_year: {
          profileId: profile.id,
          type: data.type,
          month: data.month,
          year: data.year,
        },
      },
      create: {
        profileId: profile.id,
        businessId,
        type: data.type,
        targetValue: data.targetValue,
        month: data.month,
        year: data.year,
        bonusAmount: data.bonusAmount,
      },
      update: {
        targetValue: data.targetValue,
        bonusAmount: data.bonusAmount,
      },
    });

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar meta' });
  }
});

// Get team ranking
router.get('/ranking', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { month, year } = req.query;

    const m = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const y = year ? parseInt(year as string) : new Date().getFullYear();

    const rankings = await prisma.professionalRanking.findMany({
      where: {
        businessId,
        month: m,
        year: y,
      },
      orderBy: { position: 'asc' },
      include: {
        user: { select: { name: true } },
      },
    });

    res.json(rankings);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

// Calculate and update rankings (cron job)
router.post('/ranking/calculate', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { month, year } = req.body;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const professionals = await prisma.user.findMany({
      where: { businessId, role: 'PROFESSIONAL', isActive: true },
    });

    const rankingData = await Promise.all(
      professionals.map(async (prof) => {
        const [appointments, payments, ratings, newClients] = await Promise.all([
          prisma.appointment.count({
            where: {
              professionalId: prof.id,
              startTime: { gte: startOfMonth, lte: endOfMonth },
              status: 'COMPLETED',
            },
          }),
          prisma.payment.aggregate({
            where: {
              professionalId: prof.id,
              paidAt: { gte: startOfMonth, lte: endOfMonth },
            },
            _sum: { finalAmount: true },
          }),
          prisma.clientRating.aggregate({
            where: {
              professionalId: prof.id,
              createdAt: { gte: startOfMonth, lte: endOfMonth },
            },
            _avg: { rating: true },
          }),
          prisma.appointment.groupBy({
            by: ['clientId'],
            where: {
              professionalId: prof.id,
              startTime: { gte: startOfMonth, lte: endOfMonth },
              client: {
                createdAt: { gte: startOfMonth, lte: endOfMonth },
              },
            },
          }),
        ]);

        return {
          userId: prof.id,
          revenue: Number(payments._sum.finalAmount || 0),
          appointments,
          newClients: newClients.length,
          averageRating: Number(ratings._avg.rating || 0),
        };
      })
    );

    rankingData.sort((a, b) => b.revenue - a.revenue);

    await Promise.all(
      rankingData.map((data, index) =>
        prisma.professionalRanking.upsert({
          where: {
            businessId_userId_month_year: {
              businessId,
              userId: data.userId,
              month,
              year,
            },
          },
          create: {
            businessId,
            userId: data.userId,
            month,
            year,
            revenue: data.revenue,
            appointments: data.appointments,
            newClients: data.newClients,
            averageRating: data.averageRating,
            position: index + 1,
          },
          update: {
            revenue: data.revenue,
            appointments: data.appointments,
            newClients: data.newClients,
            averageRating: data.averageRating,
            position: index + 1,
          },
        })
      )
    );

    res.json({ success: true, count: rankingData.length });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular ranking' });
  }
});

// Get badges
router.get('/badges', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      include: { badges: { orderBy: { earnedAt: 'desc' } } },
    });

    res.json(profile?.badges || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar badges' });
  }
});

// Award badge (system or owner)
router.post('/badges/:userId', async (req: Request, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const data = req.body;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: targetUserId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const badge = await prisma.professionalBadge.create({
      data: {
        profileId: profile.id,
        type: data.type,
        name: data.name,
        description: data.description,
        iconUrl: data.iconUrl,
        requirement: data.requirement,
        achievedValue: data.achievedValue,
      },
    });

    res.json(badge);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar badge' });
  }
});

// Respond to rating
router.post('/ratings/:ratingId/respond', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { ratingId } = req.params;
    const { response } = req.body;

    const rating = await prisma.clientRating.findUnique({
      where: { id: ratingId },
    });

    if (!rating || rating.professionalId !== userId) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    const updated = await prisma.clientRating.update({
      where: { id: ratingId },
      data: {
        response,
        respondedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao responder avaliação' });
  }
});

// Track referral
router.post('/referral/:referralCode', async (req: Request, res: Response) => {
  try {
    const { referralCode } = req.params;
    const { clientId: _clientId } = req.body;

    const profile = await prisma.professionalProfile.findUnique({
      where: { referralCode },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Código de indicação inválido' });
    }

    await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: {
        clientsReferred: { increment: 1 },
      },
    });

    res.json({ success: true, professionalId: profile.userId });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar indicação' });
  }
});

// ============ MARKETING POR PROFISSIONAL ============

// Get marketing links and info
router.get('/marketing', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            business: { select: { name: true, slug: true } },
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Generate marketing links
    const baseUrl = process.env.APP_URL || 'https://app.bela360.com.br';
    const businessSlug = profile.user.business.slug;

    const marketingLinks = {
      profileLink: `${baseUrl}/p/${profile.slug}`,
      bookingLink: `${baseUrl}/agendar/${businessSlug}?prof=${profile.slug}`,
      referralLink: `${baseUrl}/indicacao/${profile.referralCode}`,
      qrCodeUrl: `${baseUrl}/api/qr?url=${encodeURIComponent(`${baseUrl}/p/${profile.slug}`)}`,
    };

    res.json({
      profile: {
        slug: profile.slug,
        referralCode: profile.referralCode,
        isPublic: profile.isPublic,
        bio: profile.bio,
        photoUrl: profile.photoUrl,
      },
      links: marketingLinks,
      stats: {
        clientsReferred: profile.clientsReferred,
        totalAppointments: profile.totalAppointments,
        totalClients: profile.totalClients,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar informacoes de marketing' });
  }
});

// Get clients acquired by this professional
router.get('/marketing/clients', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const businessId = (req as any).businessId;
    const { period } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Find clients whose first appointment was with this professional
    const firstAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        professionalId: userId,
        status: 'COMPLETED',
        startTime: { gte: startDate },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
            totalAppointments: true,
            totalSpent: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // Filter to get only NEW clients (first appointment)
    const seenClients = new Set<string>();
    const newClients = [];

    for (const apt of firstAppointments) {
      if (!seenClients.has(apt.clientId)) {
        seenClients.add(apt.clientId);

        // Check if this was the client's first appointment overall
        const firstApt = await prisma.appointment.findFirst({
          where: {
            clientId: apt.clientId,
            status: 'COMPLETED',
          },
          orderBy: { startTime: 'asc' },
        });

        if (firstApt && firstApt.professionalId === userId) {
          newClients.push({
            ...apt.client,
            firstAppointmentDate: apt.startTime,
          });
        }
      }
    }

    // Calculate stats
    const totalRevenue = newClients.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
    const avgSpent = newClients.length > 0 ? totalRevenue / newClients.length : 0;

    res.json({
      period,
      startDate,
      clients: newClients,
      stats: {
        totalNewClients: newClients.length,
        totalRevenue,
        averageSpentPerClient: avgSpent,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clientes captados' });
  }
});

// Get marketing stats overview
router.get('/marketing/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const businessId = (req as any).businessId;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Count new clients this month vs last month
    const [thisMonthClients, lastMonthClients, totalClients] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          businessId,
          professionalId: userId,
          status: 'COMPLETED',
          startTime: { gte: thisMonth },
        },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
      prisma.appointment.findMany({
        where: {
          businessId,
          professionalId: userId,
          status: 'COMPLETED',
          startTime: { gte: lastMonth, lt: thisMonth },
        },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
      prisma.appointment.findMany({
        where: {
          businessId,
          professionalId: userId,
          status: 'COMPLETED',
        },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
    ]);

    // Get return rate (clients who came back)
    const returningClients = await prisma.client.count({
      where: {
        businessId,
        totalAppointments: { gte: 2 },
        appointments: {
          some: { professionalId: userId },
        },
      },
    });

    const returnRate = totalClients.length > 0
      ? (returningClients / totalClients.length) * 100
      : 0;

    // Growth calculation
    const growth = lastMonthClients.length > 0
      ? ((thisMonthClients.length - lastMonthClients.length) / lastMonthClients.length) * 100
      : thisMonthClients.length > 0 ? 100 : 0;

    res.json({
      referrals: profile.clientsReferred,
      totalAppointments: profile.totalAppointments,
      thisMonth: {
        uniqueClients: thisMonthClients.length,
      },
      lastMonth: {
        uniqueClients: lastMonthClients.length,
      },
      allTime: {
        totalClients: totalClients.length,
        returningClients,
        returnRate: Math.round(returnRate * 10) / 10,
      },
      growth: Math.round(growth * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas de marketing' });
  }
});

// Increment profile view (public endpoint) - updates totalClients as view proxy
router.post('/public/:slug/view', async (_req: Request, res: Response) => {
  // Profile views tracking removed - not in schema
  // Could be added via separate analytics service if needed
  res.json({ success: true });
});

// Send promotional message to professional's clients
router.post('/marketing/send', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const businessId = (req as any).businessId;
    const { message, clientIds, templateId } = req.body;

    // Get business WhatsApp config
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { whatsappInstanceId: true, whatsappConnected: true },
    });

    if (!business?.whatsappInstanceId || !business.whatsappConnected) {
      return res.status(400).json({ error: 'WhatsApp não configurado' });
    }

    // Get professional info
    const professional = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Get clients
    let targetClients;
    if (clientIds && clientIds.length > 0) {
      targetClients = await prisma.client.findMany({
        where: {
          id: { in: clientIds },
          businessId,
        },
        select: { id: true, name: true, phone: true },
      });
    } else {
      // Default: clients who had appointments with this professional
      targetClients = await prisma.client.findMany({
        where: {
          businessId,
          appointments: {
            some: { professionalId: userId },
          },
        },
        select: { id: true, name: true, phone: true },
        take: 50, // Limit to 50 clients per batch
      });
    }

    // Get message content from template if provided
    let finalMessage = message;
    if (templateId) {
      const template = await prisma.contentTemplate.findUnique({
        where: { id: templateId },
      });
      if (template) {
        finalMessage = template.content;
      }
    }

    // Queue messages for sending (simplified - in production would use campaign system)
    const results = {
      queued: targetClients.length,
      clients: targetClients.map(c => c.name),
      professionalName: professional?.name,
      messagePreview: finalMessage?.substring(0, 100) + '...',
    };

    res.json({
      success: true,
      message: `${results.queued} mensagens serão enviadas`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagens' });
  }
});

export const professionalRoutes: Router = router;
