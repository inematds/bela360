import { Request, Response, NextFunction } from 'express';
import { marketingService } from './marketing.service';
import { CampaignStatus } from '@prisma/client';

export class MarketingController {
  /**
   * Create campaign
   */
  async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const campaign = await marketingService.createCampaign(businessId, req.body);

      res.status(201).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { status } = req.query;

      const filters: { status?: CampaignStatus } = {};
      if (status) filters.status = status as CampaignStatus;

      const campaigns = await marketingService.getCampaigns(businessId, filters);

      res.json({
        success: true,
        data: campaigns,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const campaign = await marketingService.getCampaignById(businessId, id);

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const campaign = await marketingService.updateCampaign(businessId, id, req.body);

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await marketingService.deleteCampaign(businessId, id);

      res.json({
        success: true,
        message: 'Campanha excluída',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start campaign
   */
  async startCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const campaign = await marketingService.startCampaign(businessId, id);

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign stats
   */
  async getCampaignStats(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const stats = await marketingService.getCampaignStats(businessId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register rating
   */
  async registerRating(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const rating = await marketingService.registerRating(businessId, req.body);

      res.status(201).json({
        success: true,
        data: rating,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ratings
   */
  async getRatings(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { clientId, minRating, maxRating, startDate, endDate } = req.query;

      const filters: any = {};
      if (clientId) filters.clientId = clientId as string;
      if (minRating) filters.minRating = Number(minRating);
      if (maxRating) filters.maxRating = Number(maxRating);
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const ratings = await marketingService.getRatings(businessId, filters);

      res.json({
        success: true,
        data: ratings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rating stats
   */
  async getRatingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const stats = await marketingService.getRatingStats(businessId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get segments overview
   */
  async getSegmentsOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const overview = await marketingService.getSegmentsOverview(businessId);

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get segment clients
   */
  async getSegmentClients(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { segment } = req.params;
      const clients = await marketingService.getSegmentClients(businessId, segment as any);

      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const marketingController = new MarketingController();
