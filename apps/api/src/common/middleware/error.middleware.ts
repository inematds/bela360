import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../errors';
import { logger } from '../../config';
import type { ApiResponse } from '@bela360/shared';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  // Log error
  logger.error(
    {
      error: err,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
    },
    'Request error'
  );

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: err.errors,
      },
    });
    return;
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err instanceof ValidationError ? err.details : undefined,
      },
    });
    return;
  }

  // Handle unknown errors
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
};
