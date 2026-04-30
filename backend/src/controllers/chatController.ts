import { Response, NextFunction } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/authenticate';
import prisma from '../lib/prisma';
import openai, { MODEL, MAX_TOKENS, TEMPERATURE } from '../lib/openai';
import { AppError, ErrorCode } from '../utils/AppError';
import type { EmotionScore } from '../types/api';

// ─── 定数 ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `あなたは共感的なAIセルフケアコーチです。
ユーザーの感情に寄り添い、日本語で温かく丁寧にサポートしてください。
ユーザーの気持ちを否定せず、まず受け止めてから、必要に応じて実践的なアドバイスを提供してください。
会話を通じてユーザーが自分の感情を理解し、健やかな日常を送れるよう助けることがあなたの役割です。`;

const HISTORY_LIMIT = Number(process.env.CHAT_HISTORY_MESSAGE_LIMIT) || 10;

// ─── 感情抽出ツール定義 ──────────────────────────────────────────────────────

const EMOTION_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'extract_emotion',
    description: '会話から感情を抽出する',
    parameters: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          enum: ['joy', 'sadness', 'anger', 'fear', 'neutral'],
        },
        score: {
          type: 'number',
          description: '-1.0から1.0の感情スコア',
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: '感情カテゴリ一覧（例: ["疲労", "ストレス"]）',
        },
      },
      required: ['label', 'score', 'categories'],
    },
  },
};

const emotionArgSchema = z.object({
  label: z.enum(['joy', 'sadness', 'anger', 'fear', 'neutral']),
  score: z.number().min(-1).max(1),
  categories: z.array(z.string()),
});

// ─── バリデーションスキーマ ──────────────────────────────────────────────────

const sendMessageBodySchema = z.object({
  content: z.string().min(1, { message: 'メッセージ内容は必須です' }),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── private helpers ─────────────────────────────────────────────────────────

async function findOwnedConversation(id: string, userId: string) {
  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) throw new AppError(ErrorCode.NOT_FOUND, 404, '会話が見つかりません');
  if (conv.userId !== userId) throw new AppError(ErrorCode.FORBIDDEN, 403, '権限がありません');
  return conv;
}

function extractEmotionFromResponse(
  response: OpenAI.Chat.ChatCompletion,
): EmotionScore | null {
  const toolCalls = response.choices[0]?.message?.tool_calls;
  if (!toolCalls || toolCalls.length === 0) return null;
  try {
    const args: unknown = JSON.parse(toolCalls[0].function.arguments);
    const parsed = emotionArgSchema.safeParse(args);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ─── S2-A-02: POST /api/chat ──────────────────────────────────────────────────

export async function createChatSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const conversation = await prisma.conversation.create({
      data: { userId: req.userId! },
      select: { id: true, startedAt: true, lastMessageAt: true },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    });

    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
}

// ─── S2-A-03: POST /api/chat/:conversationId/message ─────────────────────────

export async function sendMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = sendMessageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, parsed.error.issues[0].message));
    return;
  }

  const { conversationId } = req.params;

  try {
    await findOwnedConversation(conversationId, req.userId!);

    await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: parsed.data.content,
      },
    });

    // 直近 N 件を降順で取得し、時系列順（昇順）に反転して OpenAI へ渡す
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { role: true, content: true },
    });
    const messagesForApi = history.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      messages: messagesForApi,
      tools: [EMOTION_TOOL],
      tool_choice: 'auto',
    });

    const emotionScore = extractEmotionFromResponse(completion);
    const assistantContent =
      completion.choices[0]?.message?.content ??
      '申し訳ありません。応答を生成できませんでした。';

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: assistantContent,
        emotionScore: emotionScore == null
          ? undefined
          : (emotionScore as unknown as Prisma.InputJsonValue),
      },
      select: { id: true, role: true, content: true, emotionScore: true, createdAt: true },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    res.status(201).json({
      message: {
        id: assistantMessage.id,
        role: 'assistant' as const,
        content: assistantMessage.content,
        emotionScore: assistantMessage.emotionScore as EmotionScore | null,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(ErrorCode.INTERNAL_ERROR, 500, 'AIの応答中にエラーが発生しました'));
  }
}

// ─── S2-A-04: GET /api/chat/:conversationId/history ──────────────────────────

export async function getChatHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = historyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, parsed.error.issues[0].message));
    return;
  }

  const { conversationId } = req.params;

  try {
    await findOwnedConversation(conversationId, req.userId!);

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: parsed.data.limit,
      select: { id: true, role: true, content: true, emotionScore: true, createdAt: true },
    });

    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        emotionScore: m.emotionScore as EmotionScore | null,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
}
