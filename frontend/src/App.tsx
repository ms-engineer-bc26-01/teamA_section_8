import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout"; // ← 1. パスを common から layout に変更
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";
import { Trend } from "./pages/Trend";
import { Settings } from "./pages/Settings";
import UiPreview from "./pages/UiPreview"; // ← 2. プレビュー用コンポーネントをインポート

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- レイアウトを持たないルート（認証系・開発用など） --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* S0-B-04 手動確認用のプレビュールート（開発時のみ使用） */}
        <Route path="/ui-preview" element={<UiPreview />} />

        {/* --- レイアウトを持つルート（ログイン後） --- */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/trend" element={<Trend />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* --- リダイレクト・404 --- */}
        {/* 初期アクセス時はログイン画面へ */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* 存在しないURLへのアクセス */}
        <Route
          path="*"
          element={
            <div className="p-10 font-bold text-center text-gray-500">
              404 Not Found
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
