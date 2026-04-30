import { delay, http, HttpResponse } from "msw";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
};

const messageStore = new Map<string, ChatMessage[]>();

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-1",
    role: "assistant",
    content: "今日もお疲れさまです。今の気分を教えてください。",
    createdAt: "2026-04-29T09:00:00.000Z",
  },
  {
    id: "user-1",
    role: "user",
    content: "少し疲れているけど、話すと落ち着きます。",
    createdAt: "2026-04-29T09:00:30.000Z",
  },
];

function getMessages(conversationId: string): ChatMessage[] {
  if (!messageStore.has(conversationId)) {
    messageStore.set(conversationId, [...initialMessages]);
  }
  return messageStore.get(conversationId)!;
}

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok" });
  }),

  http.post("/api/auth/login", async () => {
    return HttpResponse.json(
      {
        user: {
          id: "uuid-1",
          email: "test@example.com",
          displayName: "テストユーザー",
        },
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": "token=mock-jwt-token; HttpOnly; Path=/",
        },
      },
    );
  }),

  http.post("/api/auth/login/error", async () => {
    return HttpResponse.json(
      {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "メールアドレスまたはパスワードが正しくありません",
        },
      },
      { status: 401 },
    );
  }),

  http.get("/api/chat/:conversationId/messages", async ({ params }) => {
    const conversationId = String(params.conversationId);
    const messages = getMessages(conversationId);
    await delay(500);

    return HttpResponse.json({ messages });
  }),

  http.post("/api/chat/:conversationId/messages", async ({ params, request }) => {
    const conversationId = String(params.conversationId);
    const { content } = (await request.json()) as { content?: string };

    if (!content || !content.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "メッセージを入力してください",
          },
        },
        { status: 400 },
      );
    }

    if (content.includes("#401")) {
      return HttpResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "認証が必要です",
          },
        },
        { status: 401 },
      );
    }

    if (content.includes("#error")) {
      return HttpResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "一時的に応答できません。時間を置いて再試行してください。",
          },
        },
        { status: 500 },
      );
    }

    await delay(900);

    const messages = getMessages(conversationId);
    const now = new Date();

    const userMessage: ChatMessage = {
      id: `user-${crypto.randomUUID()}`,
      role: "user",
      content,
      createdAt: now.toISOString(),
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${crypto.randomUUID()}`,
      role: "assistant",
      content: `受け取りました: ${content}`,
      createdAt: new Date(now.getTime() + 500).toISOString(),
    };

    messages.push(userMessage, assistantMessage);

    return HttpResponse.json({ message: assistantMessage }, { status: 200 });
  }),
];
