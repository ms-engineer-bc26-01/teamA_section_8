import { NextFunction, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authenticate';
import { AppError, ErrorCode } from '../utils/AppError';
import { ChatMessageResponse, EmotionScore } from '../types/chat';

const createMessageSchema = z.object({
  content: z.string().trim().min(1, 'メッセージを入力してください').max(2000),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

async function findOwnedConversation(id: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, '会話が見つかりません');
  }
  if (conversation.userId !== userId) {
    throw new AppError(ErrorCode.FORBIDDEN, 403, '権限がありません');
  }
  return conversation;
}

export async function createChat(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const conversation = await prisma.conversation.create({
      data: { userId: req.userId! },
      select: { id: true, startedAt: true, lastMessageAt: true },
    });
    res.status(201).json({
      conversation: {
        ...conversation,
        startedAt: conversation.startedAt.toISOString(),
        lastMessageAt: conversation.lastMessageAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function postChatMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const body = createMessageSchema.safeParse(req.body);
  if (!body.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, body.error.issues[0].message));
    return;
  }

  const conversationId = req.params.id;

  try {
    await findOwnedConversation(conversationId, req.userId!);
    await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: body.data.content,
        emotionScore: Prisma.JsonNull,
      },
    });

    const generatedContent = `受け止めました。「${body.data.content}」について、もう少し詳しく聞かせてください。`;
    const generatedEmotion: EmotionScore = {
      label: 'neutral',
      score: 0,
      categories: ['会話継続'],
    };

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant' as const,
        content: generatedContent,
        emotionScore: {
          label: generatedEmotion.label,
          score: generatedEmotion.score,
          categories: generatedEmotion.categories,
        } as Prisma.InputJsonValue,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    res.status(200).json({ message: mapMessageToResponse(assistantMessage) });
  } catch (error) {
    next(error);
  }
}

export async function getChatHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const conversationId = req.params.id;
  try {
    await findOwnedConversation(conversationId, req.userId!);
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ messages: messages.map(mapMessageToResponse) });
  } catch (error) {
    next(error);
  }
}

function mapMessageToResponse(message: {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  emotionScore: unknown;
}): ChatMessageResponse {
  const rawEmotion = message.emotionScore as Partial<EmotionScore> | null;
  const emotionScore = isValidEmotionScore(rawEmotion)
    ? {
      label: rawEmotion.label as EmotionScore['label'],
      score: rawEmotion.score,
      categories: rawEmotion.categories,
    }
    : null;

  return {
    id: message.id,
    role: message.role as ChatMessageResponse['role'],
    content: message.content,
    emotionScore,
    createdAt: message.createdAt.toISOString(),
    sources: [],
  };
}

function isValidEmotionScore(rawEmotion: Partial<EmotionScore> | null): rawEmotion is EmotionScore {
  const validLabels: ReadonlySet<EmotionScore['label']> = new Set([
    'joy',
    'sadness',
    'anger',
    'fear',
    'neutral',
  ]);
  return Boolean(
    rawEmotion
    && typeof rawEmotion.label === 'string'
    && validLabels.has(rawEmotion.label as EmotionScore['label'])
    && typeof rawEmotion.score === 'number'
    && Array.isArray(rawEmotion.categories),
  );
}
