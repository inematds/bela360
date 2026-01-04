import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { prisma } from '../../config';

// Validation schemas
const requestOTPSchema = z.object({
  phone: z.string().min(10).max(15),
});

const verifyOTPSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export class AuthController {
  /**
   * Request OTP for login
   */
  async requestOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = requestOTPSchema.parse(req.body);

      const result = await authService.requestOTP(phone);

      res.json({
        success: true,
        data: {
          message: 'Código enviado para seu WhatsApp',
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and login
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, otp } = verifyOTPSchema.parse(req.body);

      const tokens = await authService.verifyOTP(phone, otp);

      // Get user info
      const user = await prisma.user.findFirst({
        where: { phone: phone.replace(/\D/g, '') },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              whatsappConnected: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          user: {
            id: user!.id,
            name: user!.name,
            phone: user!.phone,
            email: user!.email,
            role: user!.role,
          },
          business: user!.business,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      const tokens = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (userId) {
        await authService.logout(userId);
      }

      res.json({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user info
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              status: true,
              whatsappConnected: true,
              settings: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' },
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
          },
          business: user.business,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
