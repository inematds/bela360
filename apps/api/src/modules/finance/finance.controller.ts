import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';
import { PaymentMethod } from '@prisma/client';

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
}

export const financeController = new FinanceController();
