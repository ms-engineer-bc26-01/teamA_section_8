import { http, HttpResponse } from "msw";

export const handlers = [
  // backend の HealthResponseBody に合わせる
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok" });
  }),

  // backend の LoginResponseBody + Cookie認証方針に合わせる
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

  // 失敗系の例（必要なら使う）
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

  http.post("/api/chat", () => {
    return HttpResponse.json(
      {
        conversation: {
          id: "conv-1",
          startedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }),

  http.get("/api/chat/:id/history", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json({
      messages: [
        {
          id: `${id}-msg-1`,
          role: "assistant",
          content: "こんにちは。今日はどんなことがありましたか？",
          emotionScore: { label: "neutral", score: 0, categories: ["挨拶"] },
          createdAt: new Date().toISOString(),
          sources: [],
        },
      ],
    });
  }),

  http.post("/api/chat/:id/message", async ({ request, params }) => {
    const body = (await request.json()) as { content?: string };
    const content = body?.content?.trim() ?? "";
    if (!content) {
      return HttpResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "メッセージを入力してください" } },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      message: {
        id: `${String(params.id)}-assistant-${Date.now()}`,
        role: "assistant",
        content: `受け止めました。「${content}」について、もう少し聞かせてください。`,
        emotionScore: { label: "neutral", score: 0, categories: ["会話継続"] },
        createdAt: new Date().toISOString(),
        sources: [],
      },
    });
  }),
];
