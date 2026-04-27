import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError, ErrorCode } from '../utils/AppError';

const COOKIE_NAME = 'token';
const SALT_ROUNDS = 10;

const registerSchema = z.object({
  email: z.email({ message: '有効なメールアドレスを入力してください' }),
  password: z.string().min(8, { message: 'パスワードは8文字以上で入力してください' }),
  displayName: z.string().min(1).max(100, { message: '表示名は1〜100文字で入力してください' }),
});

const loginSchema = z.object({
  email: z.email({ message: '有効なメールアドレスを入力してください' }),
  password: z.string().min(1, { message: 'パスワードは必須です' }),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, result.error.issues[0].message));
    return;
  }
  const { email, password, displayName } = result.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      next(new AppError(ErrorCode.EMAIL_EXISTS, 409, 'このメールアドレスは既に登録済みです'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });

    const token = issueToken(user.id);
    setTokenCookie(res, token);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      next(new AppError(ErrorCode.EMAIL_EXISTS, 409, 'このメールアドレスは既に登録済みです'));
      return;
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, result.error.issues[0].message));
    return;
  }
  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      next(new AppError(ErrorCode.INVALID_CREDENTIALS, 401, 'メールアドレスまたはパスワードが正しくありません'));
      return;
    }

    const token = issueToken(user.id);
    setTokenCookie(res, token);
    res.json({ user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (error) {
    next(error);
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: 'ログアウトしました' });
}

function issueToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET が設定されていません');
  return jwt.sign({ sub: userId }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

function setTokenCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
