import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        businessId: string;
        role: UserRole;
      };
    }
  }
}

export {};
