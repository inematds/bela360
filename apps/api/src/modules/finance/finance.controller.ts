import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';
import { PaymentMethod, CommissionPayoutStatus } from '@prisma/client';

export class FinanceController {
  /**
   * Register payment
   */
  async registerPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const userId = req.user!.userId;
      const payment = await financeService.registerPayment(businessId, userId, req.body);

      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payments
   */
  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { startDate, endDate, professionalId, method } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (professionalId) filters.professionalId = professionalId as string;
      if (method) filters.method = method as PaymentMethod;

      const payments = await financeService.getPayments(businessId, filters);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get commission configs
   */
  async getCommissionConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const configs = await financeService.getCommissionConfigs(businessId);

      res.json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set commission config
   */
  async setCommissionConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const config = await financeService.setCommissionConfig(businessId, req.body);

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete commission config
   */
  async deleteCommissionConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await financeService.deleteCommissionConfig(businessId, id);

      res.json({
        success: true,
        message: 'Configuração removida',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cash register for date
   */
  async getCashRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { date } = req.query;
      const registerDate = date ? new Date(date as string) : new Date();

      const register = await financeService.getCashRegister(businessId, registerDate);

      res.json({
        success: true,
        data: register,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Close cash register
   */
  async closeCashRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const userId = req.user!.userId;
      const { date, notes } = req.body;

      const register = await financeService.closeCashRegister(
        businessId,
        userId,
        new Date(date),
        notes
      );

      res.json({
        success: true,
        data: register,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cash register history
   */
  async getCashRegisterHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const history = await financeService.getCashRegisterHistory(businessId, start, end);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get professional earnings
   */
  async getProfessionalEarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { professionalId } = req.params;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1)); // Start of month
      const end = endDate ? new Date(endDate as string) : new Date();

      const earnings = await financeService.getProfessionalEarnings(
        businessId,
        professionalId,
        start,
        end
      );

      res.json({
        success: true,
        data: earnings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get financial report
   */
  async getFinancialReport(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      const report = await financeService.getFinancialReport(businessId, start, end);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending commissions
   */
  async getPendingCommissions(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const pending = await financeService.getPendingCommissions(businessId);

      res.json({
        success: true,
        data: pending,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending payments for a professional
   */
  async getPendingPaymentsForProfessional(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { professionalId } = req.params;
      const payments = await financeService.getPendingPaymentsForProfessional(businessId, professionalId);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get commission payouts
   */
  async getCommissionPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { professionalId, status, startDate, endDate } = req.query;

      const filters: any = {};
      if (professionalId) filters.professionalId = professionalId as string;
      if (status) filters.status = status as CommissionPayoutStatus;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const payouts = await financeService.getCommissionPayouts(businessId, filters);

      res.json({
        success: true,
        data: payouts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get commission payout details
   */
  async getCommissionPayoutDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const payout = await financeService.getCommissionPayoutDetails(businessId, id);

      res.json({
        success: true,
        data: payout,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create commission payout
   */
  async createCommissionPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const userId = req.user!.userId;
      const payout = await financeService.createCommissionPayout(businessId, userId, req.body);

      res.status(201).json({
        success: true,
        data: payout,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark payout as paid
   */
  async markPayoutAsPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const userId = req.user!.userId;
      const { id } = req.params;
      const payout = await financeService.markPayoutAsPaid(businessId, userId, id, req.body);

      res.json({
        success: true,
        data: payout,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel commission payout
   */
  async cancelCommissionPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await financeService.cancelCommissionPayout(businessId, id);

      res.json({
        success: true,
        message: 'Repasse cancelado',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get professional commission summary
   */
  async getProfessionalCommissionSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { professionalId } = req.params;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const summary = await financeService.getProfessionalCommissionSummary(
        businessId,
        professionalId,
        start,
        end
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my commissions (for professionals to access their own data)
   */
  async getMyCommissions(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const userId = req.user!.userId;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const summary = await financeService.getProfessionalCommissionSummary(
        businessId,
        userId,
        start,
        end
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my commission entries (for professionals to see their payment history)
   */
  async getMyCommissionEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const userId = req.user!.userId;
      const { startDate, endDate } = req.query;

      // Get all payment entries for this professional
      const entries = await financeService.getPayments(businessId, {
        professionalId: userId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      // Separate by payout status
      const pending = entries.filter(e => !e.commissionPayoutId);
      const paid = entries.filter(e => e.commissionPayoutId);

      res.json({
        success: true,
        data: {
          entries,
          pending,
          paid,
          totals: {
            pendingAmount: pending.reduce((sum, p) => sum + Number(p.commissionAmount), 0),
            paidAmount: paid.reduce((sum, p) => sum + Number(p.commissionAmount), 0),
            totalAmount: entries.reduce((sum, p) => sum + Number(p.commissionAmount), 0),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
