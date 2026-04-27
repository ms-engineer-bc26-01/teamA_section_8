import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCode } from '../utils/AppError';
import { errorHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/authenticate';

const TEST_SECRET = 'test-secret';

function buildApp(handler: (req: Request, res: Response, next: NextFunction) => void) {
  const app = express();
  app.use(cookieParser());
  app.get('/test', handler);
  app.use(errorHandler);
  return app;
}

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

describe('errorHandler', () => {
  it('AppErrorをnextに渡すと対応するステータスと{ error }形式で返す', async () => {
    const app = buildApp((_req, _res, next) => {
      next(new AppError(ErrorCode.NOT_FOUND, 404, 'リソースが見つかりません'));
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'リソースが見つかりません' } });
  });

  it('未知のErrorをnextに渡すと500 INTERNAL_ERRORを返す', async () => {
    const app = buildApp((_req, _res, next) => {
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
  function buildAuthApp() {
    const app = express();
    app.use(cookieParser());
    app.get('/protected', authenticate, (_req, res) => res.json({ ok: true }));
    app.use(errorHandler);
    return app;
  }

  it('tokenなしで401 UNAUTHORIZEDを返す', async () => {
    const app = buildAuthApp();
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('不正なtokenで401 UNAUTHORIZEDを返す', async () => {
    const app = buildAuthApp();
    const res = await request(app).get('/protected').set('Cookie', 'token=invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('有効なtokenでnext()を呼ぶ', async () => {
    const app = buildAuthApp();
    const token = jwt.sign({ sub: 'user-1' }, TEST_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/protected').set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
