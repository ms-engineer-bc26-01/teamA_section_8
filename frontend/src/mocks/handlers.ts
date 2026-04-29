import { http, HttpResponse } from "msw";

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
];
