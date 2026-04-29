import { randomBytes } from 'node:crypto';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCode } from '../utils/AppError';
import { errorHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/authenticate';

const TEST_SECRET = randomBytes(32).toString('hex');

type Handler = (req: Request, res: Response, next: NextFunction) => void;

function buildApp(route: string, ...handlers: Handler[]) {
  const app = express();
  app.use(cookieParser());
  app.get(route, ...handlers);
  app.use(errorHandler);
  return app;
}

const authApp = buildApp('/protected', authenticate, (_req, res) => res.json({ ok: true }));

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

describe('errorHandler', () => {
  it('AppErrorをnextに渡すと対応するステータスと{ error }形式で返す', async () => {
    const app = buildApp('/test', (_req, _res, next) => {
      next(new AppError(ErrorCode.NOT_FOUND, 404, 'リソースが見つかりません'));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'リソースが見つかりません' } });
  });

  it('未知のErrorをnextに渡すと500 INTERNAL_ERRORを返す', async () => {
    const app = buildApp('/test', (_req, _res, next) => {
      next(new Error('予期しないエラー'));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' },
    });
  });
});

describe('authenticate middleware', () => {
  it('tokenなしで401 UNAUTHORIZEDを返す', async () => {
    const res = await request(authApp).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('不正なtokenで401 UNAUTHORIZEDを返す', async () => {
    const res = await request(authApp).get('/protected').set('Cookie', 'token=invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('有効なtokenでnext()を呼ぶ', async () => {
    const token = jwt.sign({ sub: 'user-1' }, TEST_SECRET, { expiresIn: '1h' });
    const res = await request(authApp).get('/protected').set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
