import { Request, Response, NextFunction } from 'express';
import { waitlistService } from './waitlist.service';
import { WaitlistStatus } from '@prisma/client';

export class WaitlistController {
  /**
   * Add to waitlist
   */
  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const entry = await waitlistService.add(businessId, req.body);

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get waitlist
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { date, status } = req.query;

      const filters: { date?: Date; status?: WaitlistStatus } = {};
      if (date) filters.date = new Date(date as string);
      if (status) filters.status = status as WaitlistStatus;

      const entries = await waitlistService.getAll(businessId, filters);

      res.json({
        success: true,
        data: entries,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get waitlist entry
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const entry = await waitlistService.getById(businessId, id);

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove from waitlist
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await waitlistService.remove(businessId, id);

      res.json({
        success: true,
        message: 'Removido da lista de espera',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const stats = await waitlistService.getStats(businessId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get demand by date
   */
  async getDemand(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const demand = await waitlistService.getDemandByDate(businessId, start, end);

      res.json({
        success: true,
        data: demand,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Convert to appointment
   */
  async convert(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const { appointmentId } = req.body;

      await waitlistService.convert(businessId, id, appointmentId);

      res.json({
        success: true,
        message: 'Convertido para agendamento',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const waitlistController = new WaitlistController();
