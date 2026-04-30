import { http, HttpResponse } from "msw";

type AuthRequestBody = {
  email?: string;
  password?: string;
  displayName?: string;
};

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok" });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const { email } = (await request.json()) as AuthRequestBody;

    if (email === "error@example.com") {
      return HttpResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "メールアドレスまたはパスワードが正しくありません",
          },
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      {
        user: {
          id: "user-uuid-001",
          displayName: "テスター",
          email: email ?? "test@example.com",
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

  http.post("/api/auth/register", async ({ request }) => {
    const { email, displayName } = (await request.json()) as AuthRequestBody;

    return HttpResponse.json(
      {
        user: {
          id: "user-uuid-002",
          displayName: displayName ?? "新規ユーザー",
          email: email ?? "new-user@example.com",
        },
      },
      {
        status: 201,
        headers: {
          "Set-Cookie": "token=mock-jwt-token; HttpOnly; Path=/",
        },
      },
    );
  }),
];
