import { http, HttpResponse } from "msw";

export const handlers = [
  // /health へのGETリクエストに対するダミー応答
  http.get("/health", () => {
    return HttpResponse.json({ status: "ok", message: "MSW is running!" });
  }),

  // /auth/login へのPOSTリクエストに対するダミー応答
  http.post("/auth/login", async () => {
    // ログイン成功したフリをして、適当なトークンを返す
    return HttpResponse.json({
      token: "dummy-jwt-token-123456789",
      user: {
        id: "1",
        display_name: "テストユーザー",
      },
    });
  }),
];
