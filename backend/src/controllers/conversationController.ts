import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authenticate';
import prisma from '../lib/prisma';
import { AppError, ErrorCode } from '../utils/AppError';

export async function createConversation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const conversation = await prisma.conversation.create({
      data: { userId: req.userId! },
      select: { id: true, startedAt: true, lastMessageAt: true },
    });
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
}

const listQuerySchema = z.object({
  cursor: z.iso.datetime({ message: 'cursorはISO8601形式で指定してください' }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function listConversations(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, parsed.error.issues[0].message));
    return;
  }
  const { cursor, limit } = parsed.data;

  try {
    const rows = await prisma.conversation.findMany({
      where: {
        userId: req.userId!,
        ...(cursor ? { lastMessageAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit + 1,
      select: { id: true, startedAt: true, lastMessageAt: true },
    });

    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const nextCursor = hasNext ? items.at(-1)!.lastMessageAt.toISOString() : null;

    res.json({ conversations: items, nextCursor });
  } catch (error) {
    next(error);
  }
}

async function findOwnedConversation(
  id: string,
  userId: string,
  next: NextFunction,
) {
  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) {
    next(new AppError(ErrorCode.NOT_FOUND, 404, '会話が見つかりません'));
    return null;
  }
  if (conv.userId !== userId) {
    next(new AppError(ErrorCode.FORBIDDEN, 403, '権限がありません'));
    return null;
  }
  return conv;
}

export async function updateConversation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = req.params;
  try {
    const conv = await findOwnedConversation(id, req.userId!, next);
    if (!conv) return;

    const updated = await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
      select: { id: true, startedAt: true, lastMessageAt: true },
    });
    res.json({ conversation: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteConversation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = req.params;
  try {
    const conv = await findOwnedConversation(id, req.userId!, next);
    if (!conv) return;

    await prisma.conversation.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
