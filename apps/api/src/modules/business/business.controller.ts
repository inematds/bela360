import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { businessService } from './business.service';

// Validation schemas
const createBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  type: z.enum(['SALON', 'BARBERSHOP', 'AESTHETICS', 'SPA', 'OTHER']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().optional(),
  ownerName: z.string().min(2).max(100),
  ownerPhone: z.string().min(10).max(15),
  ownerEmail: z.string().email().optional(),
});

const updateBusinessSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  type: z.enum(['SALON', 'BARBERSHOP', 'AESTHETICS', 'SPA', 'OTHER']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

const createProfessionalSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  role: z.enum(['PROFESSIONAL', 'ADMIN', 'RECEPTIONIST']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  commission: z.number().min(0).max(100).optional(),
});

const setWorkingHoursSchema = z.object({
  professionalId: z.string().cuid().optional(),
  hours: z.array(
    z.object({
      dayOfWeek: z.enum([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ]),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      isActive: z.boolean(),
    })
  ),
});

export class BusinessController {
  /**
   * Create new business (onboarding)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBusinessSchema.parse(req.body);
      const business = await businessService.create(data);

      res.status(201).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's business
   */
  async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const business = await businessService.getById(businessId);

      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get business by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const business = await businessService.getById(id);

      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update business
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const data = updateBusinessSchema.parse(req.body);
      const business = await businessService.update(businessId, data);

      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate business
   */
  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const business = await businessService.activate(businessId);

      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get professionals
   */
  async getProfessionals(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const professionals = await businessService.getProfessionals(businessId);

      res.json({
        success: true,
        data: professionals,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add professional
   */
  async addProfessional(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const data = createProfessionalSchema.parse(req.body);
      const professional = await businessService.addProfessional({
        businessId,
        ...data,
      });

      res.status(201).json({
        success: true,
        data: professional,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update professional
   */
  async updateProfessional(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = createProfessionalSchema.partial().parse(req.body);
      const professional = await businessService.updateProfessional(id, data);

      res.json({
        success: true,
        data: professional,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove professional
   */
  async removeProfessional(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await businessService.removeProfessional(id);

      res.json({
        success: true,
        message: 'Profissional removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get working hours
   */
  async getWorkingHours(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const { professionalId } = req.query;
      const hours = await businessService.getWorkingHours(
        businessId,
        professionalId as string | undefined
      );

      res.json({
        success: true,
        data: hours,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set working hours
   */
  async setWorkingHours(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const data = setWorkingHoursSchema.parse(req.body);
      const hours = await businessService.setWorkingHours({
        businessId,
        ...data,
      });

      res.json({
        success: true,
        data: hours,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const businessController = new BusinessController();
