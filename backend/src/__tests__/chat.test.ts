import { randomBytes } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const TEST_SECRET = randomBytes(32).toString('hex');
const USER_ID = 'user-uuid-1';

function makeToken(userId: string = USER_ID) {
  return jwt.sign({ sub: userId }, TEST_SECRET, { expiresIn: '1h' });
}

const mockConversationCreate = prisma.conversation.create as jest.Mock;
const mockConversationFindUnique = prisma.conversation.findUnique as jest.Mock;
const mockConversationUpdate = prisma.conversation.update as jest.Mock;
const mockMessageCreate = prisma.message.create as jest.Mock;
const mockMessageFindMany = prisma.message.findMany as jest.Mock;

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/chat', () => {
  it('認証なしで401を返す', async () => {
    const res = await request(app).post('/api/chat');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('作成成功で201を返す', async () => {
    const now = new Date();
    mockConversationCreate.mockResolvedValue({ id: 'conv-1', startedAt: now, lastMessageAt: now });
    const token = makeToken();
    const res = await request(app).post('/api/chat').set('Cookie', `token=${token}`);
    expect(res.status).toBe(201);
    expect(res.body.conversation.id).toBe('conv-1');
  });
});

describe('POST /api/chat/:id/message', () => {
  const token = makeToken();

  it('content空で400 VALIDATION_ERRORを返す', async () => {
    mockConversationFindUnique.mockResolvedValue({ id: 'conv-1', userId: USER_ID });
    const res = await request(app)
      .post('/api/chat/conv-1/message')
      .set('Cookie', `token=${token}`)
      .send({ content: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('送信成功でassistant messageを返す', async () => {
    const now = new Date();
    mockConversationFindUnique.mockResolvedValue({ id: 'conv-1', userId: USER_ID });
    mockMessageCreate
      .mockResolvedValueOnce({ id: 'm-user', role: 'user', content: 'test', createdAt: now, emotionScore: null })
      .mockResolvedValueOnce({
        id: 'm-assistant',
        role: 'assistant',
        content: '受け止めました。',
        createdAt: now,
        emotionScore: { label: 'neutral', score: 0, categories: ['会話継続'] },
      });
    mockConversationUpdate.mockResolvedValue({});

    const res = await request(app)
      .post('/api/chat/conv-1/message')
      .set('Cookie', `token=${token}`)
      .send({ content: '今日は疲れました' });

    expect(res.status).toBe(200);
    expect(res.body.message.role).toBe('assistant');
    expect(res.body.message.sources).toEqual([]);
  });
});

describe('GET /api/chat/:id/history', () => {
  it('履歴を返す', async () => {
    const token = makeToken();
    const now = new Date();
    mockConversationFindUnique.mockResolvedValue({ id: 'conv-1', userId: USER_ID });
    mockMessageFindMany.mockResolvedValue([
      { id: 'm1', role: 'assistant', content: 'hello', createdAt: now, emotionScore: null },
    ]);
    const res = await request(app)
      .get('/api/chat/conv-1/history')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
  });
});
