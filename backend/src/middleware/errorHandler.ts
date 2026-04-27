import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err);
    } else {
      logger.warn({ code: err.code, message: err.message }, 'client error');
    }
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  logger.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } });
}
