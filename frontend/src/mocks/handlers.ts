import { http, HttpResponse, delay } from "msw";

export const handlers = [
  // ログインハンドラ
  http.post("/api/auth/login", async ({ request }) => {
    const { email } = (await request.json()) as { email: string };

    // テスト用：特定のメールアドレスでエラーを返す
    if (email === "error@example.com") {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({
      token: "mock-jwt-token-s1-b-03", // DoD: token 取得
      user: {
        id: "user-uuid-001",
        displayName: "テスター",
        email: email,
      },
    });
  }),

  // 新規登録ハンドラ
  http.post("/api/auth/register", async ({ request }) => {
    const { email, displayName } = (await request.json()) as {
      email: string;
      displayName: string;
    };

    return HttpResponse.json({
      token: "mock-jwt-token-new-user",
      user: {
        id: "user-uuid-002",
        displayName: displayName,
        email: email,
      },
    });
  }),
  // 人工知能とのチャット通信を偽装する処理を追加
  http.post("/api/chat", async ({ request }) => {
    // 画面側から送信された内容を読み取る
    const { message } = (await request.json()) as { message: string };

    // 実際の通信にかかる時間を疑似的に再現（一点五秒の待機）
    await delay(1500);

    // 人工知能からの返答として偽のデータを返す
    return HttpResponse.json({
      id: "chat-uuid-001",
      sender: "ai",
      message: `「${message}」ですね。今日もお疲れ様です！ゆっくり休んでくださいね。`,
      createdAt: new Date().toISOString(),
    });
  }),
];
