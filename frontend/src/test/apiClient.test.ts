// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "../api/apiClient";
import MockAdapter from "axios-mock-adapter";

// 1. location.href の代入を監視するためのモック
const locationMock = { href: "http://localhost/" };

// window.location を安全にモック化
// すでに jsdom 環境なので window は存在しますが、代入を検知するために stub します
vi.stubGlobal("location", {
  get href() {
    return locationMock.href;
  },
  set href(val: string) {
    // どんなURLが来ても、絶対パスとして解釈して末尾だけ保存
    locationMock.href = val.startsWith("/") ? `http://localhost${val}` : val;
  },
  assign: vi.fn(),
  replace: vi.fn(),
});

// 2. apiClient 用のモックアダプター
const mock = new MockAdapter(apiClient);

// 3. ログアウト関数の監視用
const logoutSpy = vi.fn();

// 4. authStore をモック化
vi.mock("../store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      token: "fake-token",
      logout: logoutSpy,
    }),
  },
}));

describe("apiClient 認証インターセプターのテスト", () => {
  beforeEach(() => {
    mock.reset();
    locationMock.href = "http://localhost/";
    vi.clearAllMocks();
  });

  it("リクエスト時に Authorization ヘッダーに Bearer トークンが付与されていること", async () => {
    mock.onGet("/test").reply(200, { success: true });
    const response = await apiClient.get("/test");
    expect(response.config.headers?.Authorization).toBe("Bearer fake-token");
  });

  it("401エラーが返ってきた時、ログアウトを実行し /login へ遷移すること", async () => {
    mock.onGet("/chat").reply(401);

    try {
      await apiClient.get("/chat");
    } catch {
      // ① logout が呼ばれたか？
      expect(logoutSpy).toHaveBeenCalled();

      // ② location.href が /login を含むか？
      // window.location.href = "/login" と書いた場合、
      // モック経由で locationMock.href に値が入ります
      expect(locationMock.href).toContain("/login");
    }
  });
});
