import { Request, Response, NextFunction } from 'express';
import { marketingService } from './marketing.service';
import { suggestionsService } from './suggestions.service';
import { templatesService, TemplateCategory, TemplateOccasion } from './templates.service';
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

  // ============ SUGGESTIONS ============

  /**
   * Get marketing suggestions
   */
  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const includeRead = req.query.includeRead === 'true';
      const suggestions = await suggestionsService.getSuggestions(businessId, includeRead);

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get suggestion counts
   */
  async getSuggestionCounts(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const counts = await suggestionsService.getCounts(businessId);

      res.json({
        success: true,
        data: counts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate suggestions (manual trigger)
   */
  async generateSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      await suggestionsService.generateSuggestions(businessId);

      res.json({
        success: true,
        message: 'Sugestoes geradas com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark suggestion as read
   */
  async markSuggestionAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await suggestionsService.markAsRead(businessId, id);

      res.json({
        success: true,
        message: 'Sugestao marcada como lida',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark suggestion as actioned
   */
  async markSuggestionAsActioned(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await suggestionsService.markAsActioned(businessId, id);

      res.json({
        success: true,
        message: 'Sugestao marcada como acionada',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dismiss suggestion
   */
  async dismissSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await suggestionsService.dismiss(businessId, id);

      res.json({
        success: true,
        message: 'Sugestao dispensada',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detect idle slots (for preview)
   */
  async getIdleSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const idleSlots = await suggestionsService.detectIdleSlots(businessId);

      res.json({
        success: true,
        data: idleSlots,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ TEMPLATES ============

  /**
   * Get all templates
   */
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { category, occasion } = req.query;

      const filters: { category?: TemplateCategory; occasion?: TemplateOccasion } = {};
      if (category) filters.category = category as TemplateCategory;
      if (occasion) filters.occasion = occasion as TemplateOccasion;

      const templates = await templatesService.getAll(businessId, filters);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const template = await templatesService.getById(businessId, id);

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create template
   */
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const template = await templatesService.create(businessId, req.body);

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const template = await templatesService.update(businessId, id, req.body);

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await templatesService.delete(businessId, id);

      res.json({
        success: true,
        message: 'Template excluido',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const { name } = req.body;
      const template = await templatesService.duplicate(businessId, id, name);

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get templates by category with preview
   */
  async getTemplatesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { category } = req.params;
      const templates = await templatesService.getByCategory(businessId, category as TemplateCategory);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fill template with variables
   */
  async fillTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const { variables } = req.body;

      const template = await templatesService.getById(businessId, id);
      const filled = templatesService.fillTemplate(template.content, variables);

      res.json({
        success: true,
        data: {
          original: template.content,
          filled,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template stats
   */
  async getTemplateStats(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const stats = await templatesService.getStats(businessId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const marketingController = new MarketingController();
