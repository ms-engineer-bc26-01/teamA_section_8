import React from "react";
import {
  Home,
  MessageCircle,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Link, useLocation, useNavigate } from "react-router-dom"; // ← 追加：ルーティング用の機能

export const Sidebar: React.FC = () => {
  const { logout } = useAuthStore();
  const location = useLocation(); // ← 今いるURLを取得
  const navigate = useNavigate(); // ← ナビゲーション用のフック

  const handleLogout = () => {
    logout(); // ストアのデータを消去
    navigate("/login"); // ログイン画面へ強制移動
  };

  // active を手動で設定するのではなく、遷移先の path を定義します
  const menuItems = [
    { icon: <Home size={20} />, label: "ホーム", path: "/home" },
    { icon: <MessageCircle size={20} />, label: "チャット", path: "/chat" },
    { icon: <TrendingUp size={20} />, label: "トレンド", path: "/trend" },
    { icon: <Settings size={20} />, label: "設定", path: "/settings" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-purple-50 flex flex-col h-screen sticky top-0 hidden md:flex">
      <div className="p-6">
        <h1 className="text-xl font-bold text-purple-600 tracking-tight">
          心の日記アプリ
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          // 今のURLとメニューのpathが一致するか判定
          const isActive = location.pathname === item.path;

          return (
            <Link // ← button から Link に変更
              key={item.path} // ← index から path に変更（pathはユニークなはずなので）
              to={item.path} // ← 遷移先のURLを指定
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                isActive
                  ? "bg-purple-50 text-purple-600 font-semibold"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-purple-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <LogOut size={20} />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
};
