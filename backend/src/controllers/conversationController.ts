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
