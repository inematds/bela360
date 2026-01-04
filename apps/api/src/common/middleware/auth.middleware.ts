import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config';
import { AuthenticationError } from '../errors';
import type { JWTPayload } from '@bela360/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      business?: {
        id: string;
        phone: string;
      };
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('Token não fornecido');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      throw new AuthenticationError('Token mal formatado');
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      throw new AuthenticationError('Token mal formatado');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    req.business = {
      id: decoded.businessId,
      phone: decoded.phone,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Token inválido'));
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expirado'));
      return;
    }

    next(error);
  }
}
