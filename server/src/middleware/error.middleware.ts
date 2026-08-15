import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = (err as ApiError).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.path} - ${statusCode} - ${message}`);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
