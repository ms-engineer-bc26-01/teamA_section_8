import { randomBytes } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const TEST_SECRET = randomBytes(32).toString('hex');
const MOCK_USER_ID = 'user-uuid-1';
const MOCK_OTHER_USER_ID = 'user-uuid-2';

function makeToken(userId: string = MOCK_USER_ID) {
  return jwt.sign({ sub: userId }, TEST_SECRET, { expiresIn: '1h' });
}

const mockFindConversation = prisma.conversation.findUnique as jest.Mock;
const mockUpdateConversation = prisma.conversation.update as jest.Mock;
const mockFindMessages = prisma.message.findMany as jest.Mock;
const mockCreateMessage = prisma.message.create as jest.Mock;

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/chat/:conversationId/messages', () => {
  it('認証なしで401を返す', async () => {
    const res = await request(app).get('/api/chat/conv-1/messages');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('会話が存在しない場合404を返す', async () => {
    mockFindConversation.mockResolvedValue(null);

    const token = makeToken();
    const res = await request(app)
      .get('/api/chat/conv-1/messages')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('他ユーザーの会話の場合403を返す', async () => {
    mockFindConversation.mockResolvedValue({ id: 'conv-1', userId: MOCK_OTHER_USER_ID });

    const token = makeToken();
    const res = await request(app)
      .get('/api/chat/conv-1/messages')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('正常時に200とmessages配列を返す', async () => {
    const now = new Date();
    mockFindConversation.mockResolvedValue({ id: 'conv-1', userId: MOCK_USER_ID });
    mockFindMessages.mockResolvedValue([
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'こんにちは',
        emotionScore: null,
        createdAt: now,
      },
    ]);

    const token = makeToken();
    const res = await request(app)
      .get('/api/chat/conv-1/messages')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    expect(mockFindMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId: 'conv-1' },
      }),
    );
  });
});

describe('POST /api/chat/:conversationId/messages', () => {
  it('空文字メッセージで400 VALIDATION_ERRORを返す', async () => {
    const token = makeToken();

    const res = await request(app)
      .post('/api/chat/conv-1/messages')
      .set('Cookie', `token=${token}`)
      .send({ content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('他ユーザーの会話の場合403を返す', async () => {
    mockFindConversation.mockResolvedValue({ id: 'conv-1', userId: MOCK_OTHER_USER_ID });
    const token = makeToken();

    const res = await request(app)
      .post('/api/chat/conv-1/messages')
      .set('Cookie', `token=${token}`)
      .send({ content: 'test' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('正常時にassistantメッセージを返す', async () => {
    const now = new Date();

    mockFindConversation.mockResolvedValue({ id: 'conv-1', userId: MOCK_USER_ID });
    mockCreateMessage
      .mockResolvedValueOnce({
        id: 'msg-user-1',
        role: 'user',
        content: '疲れています',
        emotionScore: null,
        createdAt: now,
      })
      .mockResolvedValueOnce({
        id: 'msg-assistant-1',
        role: 'assistant',
        content: '受け取りました: 疲れています',
        emotionScore: null,
        createdAt: now,
      });
    mockUpdateConversation.mockResolvedValue({});

    const token = makeToken();
    const res = await request(app)
      .post('/api/chat/conv-1/messages')
      .set('Cookie', `token=${token}`)
      .send({ content: '疲れています' });

    expect(res.status).toBe(200);
    expect(res.body.message.role).toBe('assistant');
    expect(mockCreateMessage).toHaveBeenCalledTimes(2);
    expect(mockUpdateConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'conv-1' },
      }),
    );
  });
});
