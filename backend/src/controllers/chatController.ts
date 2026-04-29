import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AuthRequest } from '../middleware/authenticate';
import prisma from '../lib/prisma';
import { AppError, ErrorCode } from '../utils/AppError';
import { logger } from '../utils/logger';
import { openai, OPENAI_MODEL, OPENAI_MAX_TOKENS, OPENAI_TEMPERATURE } from '../lib/openaiClient';
import { defaultRagEnricher as ragEnricher } from '../lib/ragEnricher';
import type { EmotionScore } from '../types/api';

const SYSTEM_PROMPT = `あなたは「ケアコーチ」という名前の、優しく共感力の高いAIセルフケアコーチです。

【役割】
- ユーザーの感情・体調・悩みに耳を傾け、安心して話せる場を提供する
- 批判や否定をせず、まずユーザーの気持ちを受け止めて共感する
- 必要に応じて、日常生活で取り組める具体的なセルフケアを提案する
- 医療・法律・財務の専門的な判断は行わず、必要な場合は専門家への相談を促す

【会話スタイル】
- 丁寧かつ温かみのある日本語で話す（敬語）
- 一度に多くの質問を重ねず、最も聞きたいことを一つに絞る
- ユーザーが感情を表現しやすいよう、オープンクエスチョンを活用する
- 返答は読みやすい長さを心がける（目安: 150〜350字程度。共感・受容を丁寧に伝えるため、必要に応じて長くなっても構わない）

【感情分析（必須）】
返答の末尾に必ず以下のJSONタグを追加すること（ユーザーへの表示テキストには含めない）:
[EMOTION_JSON]{"label":"joy|sadness|anger|fear|neutral","score":0.0,"categories":["..."]}[/EMOTION_JSON]`;

const CHAT_HISTORY_LIMIT =
  parseInt(process.env.CHAT_HISTORY_MESSAGE_LIMIT ?? '10', 10) || 10;

const EMOTION_TAG_RE = /\[EMOTION_JSON\]([\s\S]*?)\[\/EMOTION_JSON\]/;

function parseEmotionFromResponse(rawText: string): {
  visibleContent: string;
  emotionScore: EmotionScore | null;
} {
  const match = EMOTION_TAG_RE.exec(rawText);
  const visibleContent = rawText.replace(EMOTION_TAG_RE, '').trim();

  if (!match) {
    return { visibleContent, emotionScore: null };
  }

  try {
    const emotionScore = JSON.parse(match[1]) as EmotionScore;
    return { visibleContent, emotionScore };
  } catch {
    logger.warn('EmotionJSON のパースに失敗しました');
    return { visibleContent, emotionScore: null };
  }
}

async function findOwnedConversation(id: string, userId: string) {
  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) throw new AppError(ErrorCode.NOT_FOUND, 404, '会話が見つかりません');
  if (conv.userId !== userId) throw new AppError(ErrorCode.FORBIDDEN, 403, '権限がありません');
  return conv;
}

// S2-A-02: POST /api/chat
export async function startChat(
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

const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'メッセージを入力してください')
    .max(2000, 'メッセージは2000文字以内で入力してください'),
  location: z
    .object({ lat: z.number(), lng: z.number() })
    .optional(),
});

// S2-A-03: POST /api/chat/:id/message
export async function sendMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new AppError(ErrorCode.VALIDATION_ERROR, 400, parsed.error.issues[0].message));
    return;
  }
  const { content, location } = parsed.data;
  const { id } = req.params;

  try {
    await findOwnedConversation(id, req.userId!);

    const historyRows = await prisma.message.findMany({
      where: { conversationId: id, role: { in: ['user', 'assistant'] } },
      orderBy: { createdAt: 'asc' },
      take: CHAT_HISTORY_LIMIT,
      select: { role: true, content: true },
    });

    const ragContext = await ragEnricher(content, location);

    const systemContent =
      SYSTEM_PROMPT +
      (ragContext.systemSupplement ? `\n\n${ragContext.systemSupplement}` : '');

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...historyRows.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      ...ragContext.retrievedPassages.map(
        (p): ChatCompletionMessageParam => ({ role: 'system', content: p }),
      ),
      { role: 'user', content },
    ];

    let rawText: string;
    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        max_tokens: OPENAI_MAX_TOKENS,
        temperature: OPENAI_TEMPERATURE,
      });
      const choice = completion.choices[0]?.message?.content;
      if (!choice) {
        throw new AppError(ErrorCode.AI_ERROR, 502, 'AI応答の取得に失敗しました');
      }
      rawText = choice;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(err, 'OpenAI API エラー');
      throw new AppError(ErrorCode.AI_ERROR, 502, 'AI応答の取得に失敗しました');
    }

    const { visibleContent, emotionScore } = parseEmotionFromResponse(rawText);

    const assistantMessage = await prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: { conversationId: id, role: 'user', content },
      });
      const assistantMsg = await tx.message.create({
        data: {
          conversationId: id,
          role: 'assistant',
          content: visibleContent,
          emotionScore:
            emotionScore === null
              ? Prisma.JsonNull
              : (emotionScore as unknown as Prisma.InputJsonValue),
        },
        select: { id: true, role: true, content: true, emotionScore: true, createdAt: true },
      });
      await tx.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      });
      return assistantMsg;
    });

    res.status(201).json({
      message: {
        id: assistantMessage.id,
        role: 'assistant' as const,
        content: assistantMessage.content,
        emotionScore: (assistantMessage.emotionScore as EmotionScore | null) ?? null,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

// S2-A-04: GET /api/chat/:id/history
export async function getChatHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = req.params;
  try {
    await findOwnedConversation(id, req.userId!);

    // 将来的にカーソルページネーションを追加予定
    const rows = await prisma.message.findMany({
      where: { conversationId: id, role: { in: ['user', 'assistant'] } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, emotionScore: true, createdAt: true },
    });

    const messages = rows.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      emotionScore: (m.emotionScore as EmotionScore | null) ?? null,
      createdAt: m.createdAt.toISOString(),
    }));

    res.json({ messages });
  } catch (error) {
    next(error);
  }
}
