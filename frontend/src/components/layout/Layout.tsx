import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar"; // ← 1. サイドバーをインポート

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
    // 2. 全体を横並び（flex-row）のコンテナに変更
    <div className="flex h-[100dvh] bg-gray-50 relative w-full overflow-hidden">
      {/* 3. PC用のサイドバーをここに配置（Sidebar側でスマホ時は隠れる設定になっています） */}
      <Sidebar />

      {/* 右側のコンテンツエリア（スマホ時はこれが全画面になります） */}
      <div className="flex flex-col flex-1 h-full w-full relative">
        {/* オフライン時のトースト通知（上部セーフエリアを考慮） */}
        {isOffline && (
          <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-sm font-bold text-center py-2 z-[60] pt-[calc(0.5rem+env(safe-area-inset-top))]">
            インターネット接続がありません
          </div>
        )}

        {/* メインコンテンツ（overscroll-containでゴムひもスクロールを防止） */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>

        {/* 4. ボトムナビゲーションに md:hidden を追加！（PCサイズでは消える） */}
        <nav className="md:hidden bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex-shrink-0">
          <Link
            to="/home"
            className={`flex flex-col items-center justify-center min-h-[56px] min-w-[64px] transition-colors ${isActive("/home") ? "text-blue-500" : "text-gray-400"}`}
          >
            <span className="text-xl mb-1 leading-none">🏠</span>
            <span className="text-[10px] font-bold leading-none">ホーム</span>
          </Link>
          <Link
            to="/chat"
            className={`flex flex-col items-center justify-center min-h-[56px] min-w-[64px] transition-colors ${isActive("/chat") ? "text-blue-500" : "text-gray-400"}`}
          >
            <span className="text-xl mb-1 leading-none">💬</span>
            <span className="text-[10px] font-bold leading-none">チャット</span>
          </Link>
          <Link
            to="/trend"
            className={`flex flex-col items-center justify-center min-h-[56px] min-w-[64px] transition-colors ${isActive("/trend") ? "text-blue-500" : "text-gray-400"}`}
          >
            <span className="text-xl mb-1 leading-none">📈</span>
            <span className="text-[10px] font-bold leading-none">トレンド</span>
          </Link>
          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center min-h-[56px] min-w-[64px] transition-colors ${isActive("/settings") ? "text-blue-500" : "text-gray-400"}`}
          >
            <span className="text-xl mb-1 leading-none">⚙️</span>
            <span className="text-[10px] font-bold leading-none">設定</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};
