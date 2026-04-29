import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";

/**
 * MSWの有効化を行う関数
 * 定義を呼び出しより前に書くことで、エラーを防ぎます。
 */
async function enableMocking() {
  // Viteの環境変数で開発環境かどうかを判定
  if (!import.meta.env.DEV) {
    return;
  }

  // 非同期でMSWのワーカーをインポートして起動
  const { worker } = await import("./mocks/browser");

  // worker.start() は Promise を返すので return します
  return worker.start({
    onUnhandledRequest: "bypass", // 未定義のAPIリクエストを無視する設定（開発をスムーズにするため）
  });
}

// MSWの準備が完了してからReactを起動（レンダリング）する
enableMocking()
  .then(() => {
    const container = document.getElementById("root");

    if (container) {
      createRoot(container).render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    }
  })
  .catch((err) => {
    console.error("MSWの起動に失敗しました:", err);
  });
