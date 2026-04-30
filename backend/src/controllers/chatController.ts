import { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authenticate';
import prisma from '../lib/prisma';
import { AppError, ErrorCode } from '../utils/AppError';

const paramsSchema = z.object({
  conversationId: z.string().min(1, { message: 'conversationIdは必須です' }),
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, { message: 'メッセージを入力してください' }).max(2000),
});

async function ensureOwnedConversation(conversationId: string, userId: string): Promise<void> {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });

  if (!conversation) {
    throw new AppError(ErrorCode.NOT_FOUND, 404, '会話が見つかりません');
  }

  if (conversation.userId !== userId) {
    throw new AppError(ErrorCode.FORBIDDEN, 403, '権限がありません');
  }
}

export async function listMessages(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsedParams = paramsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, parsedParams.error.issues[0].message));
    return;
  }

  try {
    await ensureOwnedConversation(parsedParams.data.conversationId, req.userId!);

    const messages = await prisma.message.findMany({
      where: { conversationId: parsedParams.data.conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        emotionScore: true,
        createdAt: true,
      },
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsedParams = paramsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, parsedParams.error.issues[0].message));
    return;
  }

  const parsedBody = sendMessageSchema.safeParse(req.body);
  if (!parsedBody.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, parsedBody.error.issues[0].message));
    return;
  }

  try {
    await ensureOwnedConversation(parsedParams.data.conversationId, req.userId!);

    await prisma.message.create({
      data: {
        conversationId: parsedParams.data.conversationId,
        role: 'user',
        content: parsedBody.data.content,
      },
    });

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: parsedParams.data.conversationId,
        role: 'assistant',
        content: `受け取りました: ${parsedBody.data.content}`,
      },
      select: {
        id: true,
        role: true,
        content: true,
        emotionScore: true,
        createdAt: true,
      },
    });

    await prisma.conversation.update({
      where: { id: parsedParams.data.conversationId },
      data: { lastMessageAt: assistantMessage.createdAt },
    });

    res.json({ message: assistantMessage });
  } catch (error) {
    next(error);
  }
}
