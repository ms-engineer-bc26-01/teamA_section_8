import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCode } from '../utils/AppError';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    next(new AppError(ErrorCode.UNAUTHORIZED, 401, '認証が必要です'));
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET が設定されていません');

  try {
    const payload = jwt.verify(token, secret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError(ErrorCode.UNAUTHORIZED, 401, 'トークンが無効です'));
  }
}
