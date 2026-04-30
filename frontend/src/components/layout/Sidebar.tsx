import React from "react";
import { useAuthStore } from "../../store/authStore";
import { Link, useLocation, useNavigate } from "react-router-dom";

export const Sidebar: React.FC = () => {
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { icon: "🏠", label: "ホーム", path: "/home" },
    { icon: "💬", label: "チャット", path: "/chat" },
    { icon: "📈", label: "トレンド", path: "/trend" },
    { icon: "⚙️", label: "設定", path: "/settings" },
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
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                isActive
                  ? "bg-purple-50 text-purple-600 font-semibold"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
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
          <span aria-hidden>🚪</span>
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
};
