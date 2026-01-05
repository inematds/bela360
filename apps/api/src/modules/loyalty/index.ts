import { Router, Request, Response } from 'express';
import { prisma } from '../../config';

const router: Router = Router();

// Get loyalty program for business
router.get('/program', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;

    const program = await prisma.loyaltyProgram.findUnique({
      where: { businessId },
      include: {
        rewards: {
          where: { isActive: true },
          orderBy: { pointsCost: 'asc' },
        },
      },
    });

    if (!program) {
      return res.status(404).json({ error: 'Programa de fidelidade não encontrado' });
    }

    res.json(program);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar programa' });
  }
});

// Create or update loyalty program
router.post('/program', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const data = req.body;

    const program = await prisma.loyaltyProgram.upsert({
      where: { businessId },
      create: {
        businessId,
        isActive: data.isActive ?? true,
        pointsPerReal: data.pointsPerReal ?? 1,
        useCashback: data.useCashback ?? false,
        cashbackPercent: data.cashbackPercent ?? 5,
        silverThreshold: data.silverThreshold ?? 100,
        goldThreshold: data.goldThreshold ?? 500,
        diamondThreshold: data.diamondThreshold ?? 1000,
        bronzeDiscount: data.bronzeDiscount ?? 0,
        silverDiscount: data.silverDiscount ?? 5,
        goldDiscount: data.goldDiscount ?? 10,
        diamondDiscount: data.diamondDiscount ?? 15,
        pointsExpirationMonths: data.pointsExpirationMonths ?? 12,
      },
      update: data,
    });

    res.json(program);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar programa' });
  }
});

// Get client loyalty points
router.get('/clients/:clientId/points', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { clientId } = req.params;

    let points = await prisma.loyaltyPoints.findUnique({
      where: { clientId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        redemptions: {
          where: { isUsed: false },
          include: { reward: true },
        },
      },
    });

    if (!points) {
      points = await prisma.loyaltyPoints.create({
        data: { businessId, clientId },
        include: { transactions: true, redemptions: { include: { reward: true } } },
      });
    }

    res.json(points);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pontos' });
  }
});

// Add points to client
router.post('/clients/:clientId/points/add', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { clientId } = req.params;
    const { amount, appointmentId, description } = req.body;

    const program = await prisma.loyaltyProgram.findUnique({
      where: { businessId },
    });

    if (!program || !program.isActive) {
      return res.status(400).json({ error: 'Programa de fidelidade não ativo' });
    }

    const pointsToAdd = Math.floor(amount * Number(program.pointsPerReal));

    let loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { clientId },
    });

    if (!loyaltyPoints) {
      loyaltyPoints = await prisma.loyaltyPoints.create({
        data: { businessId, clientId },
      });
    }

    const newBalance = loyaltyPoints.currentPoints + pointsToAdd;

    let newTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' = 'BRONZE';
    if (newBalance >= program.diamondThreshold) newTier = 'DIAMOND';
    else if (newBalance >= program.goldThreshold) newTier = 'GOLD';
    else if (newBalance >= program.silverThreshold) newTier = 'SILVER';

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + program.pointsExpirationMonths);

    await prisma.$transaction([
      prisma.loyaltyPoints.update({
        where: { id: loyaltyPoints.id },
        data: {
          currentPoints: newBalance,
          totalEarned: { increment: pointsToAdd },
          currentTier: newTier,
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          loyaltyPointsId: loyaltyPoints.id,
          type: 'EARNED',
          points: pointsToAdd,
          balance: newBalance,
          appointmentId,
          description: description || `Pontos ganhos - R$${amount.toFixed(2)}`,
          expiresAt,
        },
      }),
    ]);

    res.json({ pointsAdded: pointsToAdd, newBalance, newTier });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar pontos' });
  }
});

// Get rewards list
router.get('/rewards', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;

    const program = await prisma.loyaltyProgram.findUnique({
      where: { businessId },
      include: {
        rewards: {
          where: { isActive: true },
          orderBy: { pointsCost: 'asc' },
        },
      },
    });

    res.json(program?.rewards || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar recompensas' });
  }
});

// Create reward
router.post('/rewards', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const data = req.body;

    const program = await prisma.loyaltyProgram.findUnique({
      where: { businessId },
    });

    if (!program) {
      return res.status(404).json({ error: 'Programa de fidelidade não encontrado' });
    }

    const reward = await prisma.loyaltyReward.create({
      data: {
        programId: program.id,
        name: data.name,
        description: data.description,
        pointsCost: data.pointsCost,
        type: data.type,
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount,
        serviceId: data.serviceId,
        productId: data.productId,
        validityDays: data.validityDays ?? 30,
        maxRedemptions: data.maxRedemptions,
      },
    });

    res.json(reward);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar recompensa' });
  }
});

// Redeem reward
router.post('/clients/:clientId/redeem/:rewardId', async (req: Request, res: Response) => {
  try {
    const { clientId, rewardId } = req.params;

    const loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { clientId },
    });

    if (!loyaltyPoints) {
      return res.status(404).json({ error: 'Pontos não encontrados' });
    }

    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || !reward.isActive) {
      return res.status(404).json({ error: 'Recompensa não encontrada' });
    }

    if (loyaltyPoints.currentPoints < reward.pointsCost) {
      return res.status(400).json({ error: 'Pontos insuficientes' });
    }

    const couponCode = `BL${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + reward.validityDays);

    const newBalance = loyaltyPoints.currentPoints - reward.pointsCost;

    await prisma.$transaction([
      prisma.loyaltyPoints.update({
        where: { id: loyaltyPoints.id },
        data: {
          currentPoints: newBalance,
          totalRedeemed: { increment: reward.pointsCost },
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          loyaltyPointsId: loyaltyPoints.id,
          type: 'REDEEMED',
          points: -reward.pointsCost,
          balance: newBalance,
          description: `Resgate: ${reward.name}`,
        },
      }),
      prisma.loyaltyRedemption.create({
        data: {
          loyaltyPointsId: loyaltyPoints.id,
          rewardId: reward.id,
          clientId,
          couponCode,
          pointsUsed: reward.pointsCost,
          expiresAt,
        },
      }),
      prisma.loyaltyReward.update({
        where: { id: reward.id },
        data: { totalRedemptions: { increment: 1 } },
      }),
    ]);

    res.json({ couponCode, expiresAt, reward });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resgatar recompensa' });
  }
});

// Dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;

    const [program, totalPoints, tierDistribution, recentRedemptions] = await Promise.all([
      prisma.loyaltyProgram.findUnique({ where: { businessId } }),
      prisma.loyaltyPoints.aggregate({
        where: { businessId },
        _sum: { currentPoints: true, totalEarned: true, totalRedeemed: true },
        _count: true,
      }),
      prisma.loyaltyPoints.groupBy({
        by: ['currentTier'],
        where: { businessId },
        _count: true,
      }),
      prisma.loyaltyRedemption.findMany({
        where: { loyaltyPoints: { businessId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { reward: true, client: true },
      }),
    ]);

    res.json({
      program,
      stats: {
        totalClients: totalPoints._count,
        totalPointsActive: totalPoints._sum.currentPoints || 0,
        totalPointsEarned: totalPoints._sum.totalEarned || 0,
        totalPointsRedeemed: totalPoints._sum.totalRedeemed || 0,
      },
      tierDistribution: tierDistribution.reduce((acc, item) => {
        acc[item.currentTier] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentRedemptions,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export const loyaltyRoutes: Router = router;
