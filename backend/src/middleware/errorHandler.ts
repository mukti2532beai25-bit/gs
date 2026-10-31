import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Input validation error',
      details: err.flatten(),
    });
    return;
  }

  // Multer file upload errors
  if (err instanceof MulterError) {
    res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
      code: err.code,
    });
    return;
  }

  // Generic errors
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  console.error('[API Error]:', err);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
