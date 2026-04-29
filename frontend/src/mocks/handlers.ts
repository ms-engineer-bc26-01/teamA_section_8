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
];