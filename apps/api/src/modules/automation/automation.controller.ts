import { Request, Response, NextFunction } from 'express';
import { automationService } from './automation.service';

export class AutomationController {
  /**
   * Get all automations
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const automations = await automationService.getAll(businessId);

      res.json({
        success: true,
        data: automations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get automation by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const automation = await automationService.getById(businessId, id);

      res.json({
        success: true,
        data: automation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update automation
   */
  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const automation = await automationService.upsert(businessId, req.body);

      res.status(201).json({
        success: true,
        data: automation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update automation
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const automation = await automationService.update(businessId, id, req.body);

      res.json({
        success: true,
        data: automation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle automation active status
   */
  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const automation = await automationService.toggle(businessId, id);

      res.json({
        success: true,
        data: automation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete automation
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await automationService.delete(businessId, id);

      res.json({
        success: true,
        message: 'Automação removida com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get automation stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const stats = await automationService.getStats(businessId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initialize default automations
   */
  async initializeDefaults(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      await automationService.initializeDefaults(businessId);

      res.json({
        success: true,
        message: 'Automações padrão criadas com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const automationController = new AutomationController();
