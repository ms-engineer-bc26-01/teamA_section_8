import { randomBytes } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import app from '../app';
import prisma from '../lib/prisma';

function makeP2025() {
  return new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
    code: 'P2025',
    clientVersion: '5.0.0',
  });
}

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const TEST_SECRET = randomBytes(32).toString('hex');
const MOCK_USER_ID = 'user-uuid-1';
const MOCK_OTHER_USER_ID = 'user-uuid-2';

function makeToken(userId: string = MOCK_USER_ID) {
  return jwt.sign({ sub: userId }, TEST_SECRET, { expiresIn: '1h' });
}

const mockFindMany = prisma.conversation.findMany as jest.Mock;
const mockFindUnique = prisma.conversation.findUnique as jest.Mock;
const mockUpdate = prisma.conversation.update as jest.Mock;
const mockDelete = prisma.conversation.delete as jest.Mock;

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET /api/conversations ───────────────────────────────────────────────────

describe('GET /api/conversations', () => {
  const BASE_TIME = new Date('2026-04-27T12:00:00.000Z');

  function makeConversation(offsetMin: number) {
    const t = new Date(BASE_TIME.getTime() - offsetMin * 60_000);
    return { id: `conv-${offsetMin}`, startedAt: t, lastMessageAt: t };
  }

  it('認証なしで401を返す', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('cursorが不正な形式なら400 VALIDATION_ERRORを返す', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/conversations?cursor=not-a-date')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('limitが0なら400 VALIDATION_ERRORを返す', async () => {
    const token = makeToken();
    const res = await request(app)
      .get('/api/conversations?limit=0')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('正常リクエストで200とconversations配列を返す', async () => {
    const rows = [makeConversation(0), makeConversation(1)];
    mockFindMany.mockResolvedValue(rows);

    const token = makeToken();
    const res = await request(app)
      .get('/api/conversations')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.conversations).toHaveLength(2);
    expect(res.body.nextCursor).toBeNull();
  });

  it('件数がlimitを超える場合nextCursorに最終件のlastMessageAtが入る', async () => {
    // limit=2 で3件取得 → hasNext=true
    const rows = [makeConversation(0), makeConversation(1), makeConversation(2)];
    mockFindMany.mockResolvedValue(rows);

    const token = makeToken();
    const res = await request(app)
      .get('/api/conversations?limit=2')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.conversations).toHaveLength(2);
    expect(res.body.nextCursor).toBe(rows[1].lastMessageAt.toISOString());
  });

  it('cursor指定時にPrismaのwhereにlt条件が渡される', async () => {
    mockFindMany.mockResolvedValue([]);
    const cursor = '2026-04-27T10:00:00.000Z';
    const token = makeToken();

    await request(app)
      .get(`/api/conversations?cursor=${cursor}`)
      .set('Cookie', `token=${token}`);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          lastMessageAt: { lt: new Date(cursor) },
        }),
      }),
    );
  });
});

// ─── DELETE /api/conversations/:id ────────────────────────────────────────────

describe('DELETE /api/conversations/:id', () => {
  it('認証なしで401を返す', async () => {
    const res = await request(app).delete('/api/conversations/some-id');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('存在しないIDで404 NOT_FOUNDを返す', async () => {
    mockFindUnique.mockResolvedValue(null);
    const token = makeToken();
    const res = await request(app)
      .delete('/api/conversations/non-existent')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('他ユーザーのconversationで403 FORBIDDENを返す', async () => {
    mockFindUnique.mockResolvedValue({ id: 'conv-1', userId: MOCK_OTHER_USER_ID });
    const token = makeToken();
    const res = await request(app)
      .delete('/api/conversations/conv-1')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('自分のconversationを削除すると204を返す', async () => {
    mockFindUnique.mockResolvedValue({ id: 'conv-1', userId: MOCK_USER_ID });
    mockDelete.mockResolvedValue({});
    const token = makeToken();
    const res = await request(app)
      .delete('/api/conversations/conv-1')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'conv-1' } });
  });

  it('findUniqueとdeleteの間に削除されてP2025が発生した場合404を返す', async () => {
    mockFindUnique.mockResolvedValue({ id: 'conv-1', userId: MOCK_USER_ID });
    mockDelete.mockRejectedValue(makeP2025());
    const token = makeToken();
    const res = await request(app)
      .delete('/api/conversations/conv-1')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── PUT /api/conversations/:id ───────────────────────────────────────────────

describe('PUT /api/conversations/:id', () => {
  it('認証なしで401を返す', async () => {
    const res = await request(app).put('/api/conversations/some-id');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('存在しないIDで404 NOT_FOUNDを返す', async () => {
    mockFindUnique.mockResolvedValue(null);
    const token = makeToken();
    const res = await request(app)
      .put('/api/conversations/non-existent')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('他ユーザーのconversationで403 FORBIDDENを返す', async () => {
    mockFindUnique.mockResolvedValue({ id: 'conv-1', userId: MOCK_OTHER_USER_ID });
    const token = makeToken();
    const res = await request(app)
      .put('/api/conversations/conv-1')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('自分のconversationを更新すると200と更新後のconversationを返す', async () => {
    const now = new Date();
    mockFindUnique.mockResolvedValue({ id: 'conv-1', userId: MOCK_USER_ID });
    mockUpdate.mockResolvedValue({ id: 'conv-1', startedAt: now, lastMessageAt: now });
    const token = makeToken();
    const res = await request(app)
      .put('/api/conversations/conv-1')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.conversation.id).toBe('conv-1');
  });

  it('findUniqueとupdateの間に削除されてP2025が発生した場合404を返す', async () => {
    mockFindUnique.mockResolvedValue({ id: 'conv-1', userId: MOCK_USER_ID });
    mockUpdate.mockRejectedValue(makeP2025());
    const token = makeToken();
    const res = await request(app)
      .put('/api/conversations/conv-1')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
