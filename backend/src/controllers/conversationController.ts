import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import prisma from '../lib/prisma';

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
