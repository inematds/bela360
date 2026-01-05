import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma, logger } from '../../config';
import { AppError } from '../../common/errors';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

// Validation schemas
const createPaymentSchema = z.object({
  appointmentId: z.string().cuid(),
  amount: z.number().positive(),
  discount: z.number().min(0).optional(),
  method: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

const commissionConfigSchema = z.object({
  professionalId: z.string().cuid(),
  serviceId: z.string().cuid().optional(),
  rate: z.number().min(0).max(100),
  fixedAmount: z.number().positive().optional(),
});

export class FinanceService {
  /**
   * Register payment for appointment
   */
  async registerPayment(businessId: string, userId: string, data: z.infer<typeof createPaymentSchema>) {
    const validated = createPaymentSchema.parse(data);

    // Get appointment with service and professional
    const appointment = await prisma.appointment.findFirst({
      where: { id: validated.appointmentId, businessId },
      include: {
        service: true,
        professional: true,
        client: true,
      },
    });

    if (!appointment) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    // Check if already paid
    const existingPayment = await prisma.payment.findFirst({
      where: {
        appointmentId: validated.appointmentId,
        status: PaymentStatus.COMPLETED,
      },
    });

    if (existingPayment) {
      throw new AppError('Este agendamento já foi pago', 409);
    }

    // Calculate commission
    const commissionConfig = await this.getCommissionConfig(
      businessId,
      appointment.professionalId,
      appointment.serviceId
    );

    const discount = validated.discount || 0;
    const finalAmount = validated.amount - discount;
    const commissionRate = Number(commissionConfig?.rate || appointment.professional.commission || 50);
    const commissionAmount = commissionConfig?.fixedAmount
      ? Number(commissionConfig.fixedAmount)
      : (finalAmount * commissionRate) / 100;
    const businessAmount = finalAmount - commissionAmount;

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        businessId,
        appointmentId: validated.appointmentId,
        clientId: appointment.clientId,
        professionalId: appointment.professionalId,
        amount: validated.amount,
        discount,
        finalAmount,
        method: validated.method,
        status: PaymentStatus.COMPLETED,
        commissionRate,
        commissionAmount,
        businessAmount,
        notes: validated.notes,
        receiptUrl: validated.receiptUrl,
        registeredById: userId,
      },
      include: {
        client: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        appointment: { select: { id: true, startTime: true } },
      },
    });

    // Update client stats
    await prisma.client.update({
      where: { id: appointment.clientId },
      data: {
        totalSpent: { increment: finalAmount },
      },
    });

    // Update or create cash register for today
    await this.updateCashRegister(businessId, payment);

    logger.info({ paymentId: payment.id, appointmentId: validated.appointmentId }, 'Payment registered');
    return payment;
  }

  /**
   * Get commission config for professional/service
   */
  async getCommissionConfig(businessId: string, professionalId: string, serviceId?: string) {
    // Try to find specific config for this service
    if (serviceId) {
      const specificConfig = await prisma.commissionConfig.findFirst({
        where: { businessId, professionalId, serviceId },
      });
      if (specificConfig) return specificConfig;
    }

    // Fall back to default config for professional
    return prisma.commissionConfig.findFirst({
      where: { businessId, professionalId, serviceId: null },
    });
  }

  /**
   * Set commission config
   */
  async setCommissionConfig(businessId: string, data: z.infer<typeof commissionConfigSchema>) {
    const validated = commissionConfigSchema.parse(data);

    // Handle null serviceId for compound unique constraint
    const whereClause = validated.serviceId
      ? {
          businessId_professionalId_serviceId: {
            businessId,
            professionalId: validated.professionalId,
            serviceId: validated.serviceId,
          },
        }
      : {
          businessId_professionalId_serviceId: {
            businessId,
            professionalId: validated.professionalId,
            serviceId: '',  // Prisma workaround - will use findFirst instead
          },
        };

    // For null serviceId, use findFirst + create/update pattern
    if (!validated.serviceId) {
      const existing = await prisma.commissionConfig.findFirst({
        where: {
          businessId,
          professionalId: validated.professionalId,
          serviceId: null,
        },
      });

      if (existing) {
        return prisma.commissionConfig.update({
          where: { id: existing.id },
          data: {
            rate: validated.rate,
            fixedAmount: validated.fixedAmount,
          },
        });
      }

      return prisma.commissionConfig.create({
        data: {
          businessId,
          professionalId: validated.professionalId,
          rate: validated.rate,
          fixedAmount: validated.fixedAmount,
        },
      });
    }

    return prisma.commissionConfig.upsert({
      where: whereClause,
      create: {
        businessId,
        professionalId: validated.professionalId,
        serviceId: validated.serviceId,
        rate: validated.rate,
        fixedAmount: validated.fixedAmount,
      },
      update: {
        rate: validated.rate,
        fixedAmount: validated.fixedAmount,
      },
    });
  }

  /**
   * Get all commission configs
   */
  async getCommissionConfigs(businessId: string) {
    return prisma.commissionConfig.findMany({
      where: { businessId },
      include: {
        professional: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete commission config
   */
  async deleteCommissionConfig(businessId: string, id: string) {
    const config = await prisma.commissionConfig.findFirst({
      where: { id, businessId },
    });

    if (!config) {
      throw new AppError('Configuração de comissão não encontrada', 404);
    }

    return prisma.commissionConfig.delete({ where: { id } });
  }

  /**
   * Get payments for business
   */
  async getPayments(businessId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    professionalId?: string;
    method?: PaymentMethod;
  }) {
    const where: any = { businessId };

    if (filters?.startDate || filters?.endDate) {
      where.paidAt = {};
      if (filters.startDate) where.paidAt.gte = filters.startDate;
      if (filters.endDate) where.paidAt.lte = filters.endDate;
    }
    if (filters?.professionalId) where.professionalId = filters.professionalId;
    if (filters?.method) where.method = filters.method;

    return prisma.payment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        professional: { select: { id: true, name: true } },
        appointment: {
          select: {
            id: true,
            startTime: true,
            service: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  /**
   * Update cash register for the day
   */
  private async updateCashRegister(businessId: string, payment: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.cashRegister.findFirst({
      where: { businessId, date: today },
    });

    const methodField = this.getMethodField(payment.method);

    if (existing) {
      await prisma.cashRegister.update({
        where: { id: existing.id },
        data: {
          [methodField]: { increment: Number(payment.finalAmount) },
          totalRevenue: { increment: Number(payment.finalAmount) },
          totalCommissions: { increment: Number(payment.commissionAmount) },
          businessProfit: { increment: Number(payment.businessAmount) },
          appointmentCount: { increment: 1 },
        },
      });
    } else {
      await prisma.cashRegister.create({
        data: {
          businessId,
          date: today,
          [methodField]: Number(payment.finalAmount),
          totalRevenue: Number(payment.finalAmount),
          totalCommissions: Number(payment.commissionAmount),
          businessProfit: Number(payment.businessAmount),
          appointmentCount: 1,
        },
      });
    }
  }

  private getMethodField(method: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      CASH: 'cashTotal',
      PIX: 'pixTotal',
      CREDIT_CARD: 'creditTotal',
      DEBIT_CARD: 'debitTotal',
      OTHER: 'otherTotal',
    };
    return map[method];
  }

  /**
   * Get cash register for date
   */
  async getCashRegister(businessId: string, date: Date) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    let register = await prisma.cashRegister.findFirst({
      where: { businessId, date: dateOnly },
      include: {
        closedBy: { select: { id: true, name: true } },
      },
    });

    if (!register) {
      // Return empty register
      register = {
        id: '',
        businessId,
        date: dateOnly,
        cashTotal: new Prisma.Decimal(0),
        pixTotal: new Prisma.Decimal(0),
        creditTotal: new Prisma.Decimal(0),
        debitTotal: new Prisma.Decimal(0),
        otherTotal: new Prisma.Decimal(0),
        totalRevenue: new Prisma.Decimal(0),
        totalCommissions: new Prisma.Decimal(0),
        businessProfit: new Prisma.Decimal(0),
        appointmentCount: 0,
        isClosed: false,
        closedAt: null,
        closedById: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        closedBy: null,
      } as any;
    }

    return register;
  }

  /**
   * Close cash register
   */
  async closeCashRegister(businessId: string, userId: string, date: Date, notes?: string) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const register = await prisma.cashRegister.findFirst({
      where: { businessId, date: dateOnly },
    });

    if (!register) {
      throw new AppError('Não há movimentação para esta data', 404);
    }

    if (register.isClosed) {
      throw new AppError('Caixa já fechado para esta data', 409);
    }

    return prisma.cashRegister.update({
      where: { id: register.id },
      data: {
        isClosed: true,
        closedAt: new Date(),
        closedById: userId,
        notes,
      },
    });
  }

  /**
   * Get cash register history
   */
  async getCashRegisterHistory(businessId: string, startDate: Date, endDate: Date) {
    return prisma.cashRegister.findMany({
      where: {
        businessId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Get professional earnings
   */
  async getProfessionalEarnings(businessId: string, professionalId: string, startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        professionalId,
        paidAt: { gte: startDate, lte: endDate },
        status: PaymentStatus.COMPLETED,
      },
      include: {
        appointment: {
          select: {
            startTime: true,
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalEarnings = payments.reduce((sum, p) => sum + Number(p.commissionAmount), 0);
    const totalServices = payments.length;

    return {
      payments,
      totalEarnings,
      totalServices,
      averagePerService: totalServices > 0 ? totalEarnings / totalServices : 0,
    };
  }

  /**
   * Get financial report
   */
  async getFinancialReport(businessId: string, startDate: Date, endDate: Date) {
    const [payments, _byService, byProfessional, byMethod] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          businessId,
          paidAt: { gte: startDate, lte: endDate },
          status: PaymentStatus.COMPLETED,
        },
        _sum: {
          finalAmount: true,
          commissionAmount: true,
          businessAmount: true,
          discount: true,
        },
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ['appointmentId'],
        where: {
          businessId,
          paidAt: { gte: startDate, lte: endDate },
          status: PaymentStatus.COMPLETED,
        },
        _sum: { finalAmount: true },
      }),
      prisma.payment.groupBy({
        by: ['professionalId'],
        where: {
          businessId,
          paidAt: { gte: startDate, lte: endDate },
          status: PaymentStatus.COMPLETED,
        },
        _sum: {
          finalAmount: true,
          commissionAmount: true,
        },
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          businessId,
          paidAt: { gte: startDate, lte: endDate },
          status: PaymentStatus.COMPLETED,
        },
        _sum: { finalAmount: true },
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

    return {
      summary: {
        totalRevenue: Number(payments._sum.finalAmount || 0),
        totalCommissions: Number(payments._sum.commissionAmount || 0),
        businessProfit: Number(payments._sum.businessAmount || 0),
        totalDiscount: Number(payments._sum.discount || 0),
        transactionCount: payments._count,
        averageTicket: payments._count > 0
          ? Number(payments._sum.finalAmount || 0) / payments._count
          : 0,
      },
      byProfessional: byProfessionalWithNames,
      byMethod,
      period: { startDate, endDate },
    };
  }

  /**
   * Get pending commissions (not yet paid out)
   */
  async getPendingCommissions(businessId: string) {
    // For simplicity, we assume all commissions are pending until manually marked
    // In a real app, you'd have a CommissionPayout model
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.groupBy({
      by: ['professionalId'],
      where: {
        businessId,
        paidAt: { gte: lastMonthStart },
        status: PaymentStatus.COMPLETED,
      },
      _sum: { commissionAmount: true },
    });

    const professionalIds = payments.map(p => p.professionalId);
    const professionals = await prisma.user.findMany({
      where: { id: { in: professionalIds } },
      select: { id: true, name: true },
    });

    return payments.map(p => ({
      professional: professionals.find(prof => prof.id === p.professionalId),
      pendingAmount: Number(p._sum.commissionAmount || 0),
    }));
  }
}

export const financeService = new FinanceService();
