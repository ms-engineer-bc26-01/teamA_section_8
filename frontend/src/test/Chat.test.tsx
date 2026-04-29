import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Chat } from "../pages/Chat"; // パスを確認してくださいね！

window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("Chat コンポーネントのテスト", () => {
  it("メッセージを送信すると、AIからの返信が画面に表示されること", async () => {
    render(<Chat />);

    // 1. 最初の挨拶が出るまで待つ（ここを確実に！）
    // findByText で 800ms のタイマーが確実に終わるのを待ちます
    await screen.findByText(/今日もお疲れ様です！/);

    // 2. 入力欄と送信ボタンを見つける
    const input = screen.getByPlaceholderText("メッセージを入力...");
    const button = screen.getByRole("button", { name: "送信" });

    // 3. メッセージを入力して送信
    fireEvent.change(input, { target: { value: "今日の気分は？" } });
    fireEvent.click(button);

    // 4. 自分のメッセージが表示されるのを「もっと長く」待つ
    // CI環境のために timeout を 10000 (10秒) に設定します
    const userMsg = await screen.findByText(
      "今日の気分は？",
      {},
      { timeout: 10000 },
    );
    expect(userMsg).toBeInTheDocument();

    // 5. AIからの返信が来るのを待つ
    // 正規表現を少し短くして、部分一致しやすくします
    const aiMsg = await screen.findByText(
      /今日もお疲れ様です！/,
      {},
      { timeout: 10000 },
    );
    expect(aiMsg).toBeInTheDocument();
  });
});
