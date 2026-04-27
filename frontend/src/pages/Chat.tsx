import { useState, useEffect } from "react";

const DUMMY_MESSAGES = [
  { id: "1", role: "assistant", content: "今日もお疲れ様です！今の気分は？" },
  { id: "2", role: "user", content: "ちょっと疲れ気味かも…。" },
];

export const Chat = () => {
  const [messages, setMessages] = useState<typeof DUMMY_MESSAGES>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初回ロードのシミュレーション（0.5秒後に表示）
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages(DUMMY_MESSAGES);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-full bg-blue-50">
      {/* ヘッダー（上部セーフエリア考慮） */}
      <header className="bg-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-sm border-b-2 border-blue-100 flex justify-between items-center z-10 flex-shrink-0">
        <h1 className="text-xl font-black text-blue-500">AI Partner 💬</h1>
        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
          オンライン
        </span>
      </header>

      {/* チャット履歴エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain">
        <div className="sm:max-w-3xl sm:mx-auto w-full space-y-6">
          {/* ローディング中は Skeleton UI を表示 */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="flex justify-start">
                <div className="bg-blue-100 h-16 w-3/4 max-w-[85%] rounded-3xl rounded-tl-none"></div>
              </div>
              <div className="flex justify-end">
                <div className="bg-blue-200 h-12 w-1/2 max-w-[85%] rounded-3xl rounded-tr-none"></div>
              </div>
            </div>
          ) : (
            /* メッセージ表示 */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-4 rounded-3xl shadow-sm max-w-[85%] sm:max-w-[70%] font-bold ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : "bg-white text-gray-700 rounded-tl-none border-2 border-transparent"
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 入力エリア（キーボード展開時に隠れないよう flex-shrink-0 を指定） */}
      <div className="p-4 bg-white border-t-2 border-blue-100 flex-shrink-0">
        <div className="flex gap-2 sm:max-w-3xl sm:mx-auto">
          {/* iOSズーム防止のため text-base (16px) を指定、タップ領域 min-h-[44px] */}
          <input
            type="text"
            placeholder="メッセージを入力..."
            className="flex-1 p-4 min-h-[44px] text-base rounded-2xl bg-gray-100 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-bold text-gray-700"
          />
          {/* 送信ボタン タップ領域 min-h-[44px], min-w-[44px] */}
          <button className="min-h-[44px] min-w-[64px] bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-2xl font-black shadow-md transition-transform active:scale-95">
            送信
          </button>
        </div>
      </div>
    </div>
  );
};
