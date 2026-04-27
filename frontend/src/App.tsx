import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/common/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";
import { Trend } from "./pages/Trend";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- レイアウトを持たないルート（認証系） --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- レイアウトを持つルート（ログイン後） --- */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/trend" element={<Trend />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* --- リダイレクト・404 --- */}
        {/* 初期アクセス時はログイン画面へ */}
        <Route path="/" element={<Navigate to="/login" replace />} />
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
