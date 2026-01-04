import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { clientsService } from './clients.service';

const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  birthDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().max(1000).optional(),
  preferredProfessionalId: z.string().cuid().optional(),
});

const updateClientSchema = createClientSchema.partial();

const filtersSchema = z.object({
  search: z.string().optional(),
  hasAppointments: z.enum(['true', 'false']).optional().transform(val =>
    val === 'true' ? true : val === 'false' ? false : undefined
  ),
  lastVisitAfter: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  lastVisitBefore: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export class ClientsController {
  /**
   * Create new client
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const data = createClientSchema.parse(req.body);
      const client = await clientsService.createOrGet({ businessId, ...data });

      res.status(201).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all clients
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const filters = filtersSchema.parse(req.query);
      const { page, limit, ...filterParams } = filters;

      const result = await clientsService.getAll(businessId, filterParams, page, limit);

      res.json({
        success: true,
        data: result.clients,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const client = await clientsService.getById(id);

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update client
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateClientSchema.parse(req.body);
      const client = await clientsService.update(id, data);

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete client
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await clientsService.delete(id);

      res.json({
        success: true,
        message: 'Cliente removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming birthdays
   */
  async getUpcomingBirthdays(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const days = parseInt(req.query.days as string) || 7;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const clients = await clientsService.getUpcomingBirthdays(businessId, startDate, endDate);

      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inactive clients
   */
  async getInactiveClients(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId;
      const days = parseInt(req.query.days as string) || 60;

      const clients = await clientsService.getInactiveClients(businessId, days);

      res.json({
        success: true,
        data: clients,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const clientsController = new ClientsController();
