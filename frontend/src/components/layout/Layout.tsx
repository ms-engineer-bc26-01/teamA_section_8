import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { navigationItems } from "./navigationItems";

export const Layout = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // オフライン状態の検知（PWA要件）
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex h-[100dvh] bg-gray-50 relative">
      {/* オフライン時のトースト通知（上部セーフエリアを考慮） */}
      {isOffline && (
        <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-sm font-bold text-center py-2 z-[60] pt-[calc(0.5rem+env(safe-area-inset-top))]">
          インターネット接続がありません
        </div>
      )}

      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* メインコンテンツ（overscroll-containでゴムひもスクロールを防止） */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>

        {/* ボトムナビゲーション（下部セーフエリア対応・最小44pxのタップ領域） */}
        <nav className="md:hidden bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex-shrink-0">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-h-[56px] min-w-[64px] transition-colors ${isActive(item.path) ? "text-blue-500" : "text-gray-400"}`}
            >
              <span className="text-xl mb-1 leading-none">{item.icon}</span>
              <span className="text-[10px] font-bold leading-none">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
