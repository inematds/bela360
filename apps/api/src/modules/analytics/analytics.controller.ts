import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { analyticsService } from './analytics.service';

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => {
    const date = new Date(val);
    date.setHours(23, 59, 59, 999);
    return date;
  }),
});

export class AnalyticsController {
  /**
   * Get dashboard stats
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const stats = await analyticsService.getDashboardStats(businessId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const range = dateRangeSchema.parse(req.query);
      const report = await analyticsService.getRevenueReport(businessId, range);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get service report
   */
  async getServiceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const range = dateRangeSchema.parse(req.query);
      const report = await analyticsService.getServiceReport(businessId, range);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get professional report
   */
  async getProfessionalReport(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const range = dateRangeSchema.parse(req.query);
      const report = await analyticsService.getProfessionalReport(businessId, range);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client retention report
   */
  async getClientRetention(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const report = await analyticsService.getClientRetentionReport(businessId);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send birthday messages
   */
  async sendBirthdayMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const sentCount = await analyticsService.sendBirthdayMessages(businessId);

      res.json({
        success: true,
        data: { sentCount },
        message: `${sentCount} mensagens de aniversário enviadas`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send reactivation campaign
   */
  async sendReactivationCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { inactiveDays } = req.body;
      const sentCount = await analyticsService.sendReactivationCampaign(
        businessId,
        inactiveDays || 60
      );

      res.json({
        success: true,
        data: { sentCount },
        message: `Campanha enviada para ${sentCount} clientes`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
