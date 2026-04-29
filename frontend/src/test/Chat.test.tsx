import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Chat } from "../pages/Chat"; // パスを確認してくださいね！

describe("Chat コンポーネントのテスト", () => {
  it("メッセージを送信すると、AIからの返信が画面に表示されること", async () => {
    render(<Chat />);

    // ✨ ここが重要！
    // 最初の 800ms の読み込みが終わって、挨拶が出るのを待つ
    // これで isLoading が false になるのを確実に待ちます
    await screen.findByText(/今日もお疲れ様です！/);

    // 入力欄と送信ボタンを見つける
    const input = screen.getByPlaceholderText("メッセージを入力...");
    const button = screen.getByRole("button", { name: "送信" });

    // メッセージを入力して送信
    fireEvent.change(input, { target: { value: "今日の気分は？" } });
    fireEvent.click(button);

    // 自分のメッセージが表示されるのを待つ
    // (findByText は要素が出るまで最大1秒間粘ってくれます)
    const userMsg = await screen.findByText("今日の気分は？");
    expect(userMsg).toBeInTheDocument();

    // AIからの返信が来るのを待つ (MSWの1.5秒を考慮して timeout を長めに)
    const aiMsg = await screen.findByText(
      /ですね。今日もお疲れ様です！/,
      {},
      { timeout: 4000 },
    );
    expect(aiMsg).toBeInTheDocument();
  });
});
