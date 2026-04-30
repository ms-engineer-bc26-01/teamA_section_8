import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";

/**
 * MSWの有効化を行う関数（定義は残しておいてOK！）
 */
// async function enableMocking() {
//   if (import.meta.env.DEV) {
//     const { worker } = await import("./mocks/browser");
//     return worker.start({ onUnhandledRequest: "bypass" });
//   }
// }

// ✅ MSWを起動せずに、直接アプリをレンダリングします
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// もし将来またMSWを使いたくなったら、ここを
// enableMocking().then(() => { ... }) 形式に戻せばOK！
