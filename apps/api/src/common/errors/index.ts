// Custom Error Classes for bela360 API

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'APP_ERROR',
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
  public details?: unknown;
}

export class AuthenticationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Muitas requisições. Tente novamente em alguns minutos.') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`Erro no serviço ${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}
