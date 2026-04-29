import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";

/**
 * MSWの有効化を行う関数
 * 定義を呼び出しより前に書くことで、エラーを防ぎます。
 */
async function enableMocking() {
  // ✅ import() をブロック内に収める（Rollup DCE に優しい）
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    return worker.start({ onUnhandledRequest: "bypass" });
  }
}

enableMocking()
  .then(() => {
    const container = document.getElementById("root");
    if (container) {
      // ✅ null チェック維持
      createRoot(container).render(
        <StrictMode>
          {" "}
          {/* ✅ StrictMode 維持 */}
          <App />
        </StrictMode>,
      );
    }
  })
  .catch((err) => {
    // ✅ エラーハンドリング維持
    console.error("MSWの起動に失敗しました:", err);
  });
