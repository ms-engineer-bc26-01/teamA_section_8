import { useState, useEffect } from "react";
import apiClient from "../api/apiClient"; // ここに理香さんのクライアントをインポート

// 型定義をメッセージの形式に合わせて調整
type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true); // 初回のローディング用
  const [isSending, setIsSending] = useState(false); // 送信中のボタン制御用

  // 1. 初回ロード：最初の挨拶だけダミーではなく「取得」するようにしてもいいですが、
  // 今回はそのまま最初のメッセージを表示するシミュレーションを残します
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "今日もお疲れ様です！今の気分は？",
        },
      ]);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 2. 送信処理のロジック
  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    // ユーザーの発言を画面に即座に追加
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputText,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText; // 通信用に保持
    setInputText("");
    setIsSending(true);

    try {
      // MSWの台本（/chat）に向かって通信！
      const response = await apiClient.post("/chat", {
        message: currentInput,
      });

      // AIからの返信を画面に追加
      const aiMsg: Message = {
        id: response.data.id,
        role: "assistant",
        content: response.data.message,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("チャット通信エラー:", error);
      // 理香さんが作ったインターセプターにより、401なら勝手にログイン画面に飛びます
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-blue-50">
      {/* ヘッダー */}
      <header className="bg-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-sm border-b-2 border-blue-100 flex justify-between items-center z-10 flex-shrink-0">
        <h1 className="text-xl font-black text-blue-500">AI Partner 💬</h1>
        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
          {isSending ? "入力中..." : "オンライン"}
        </span>
      </header>

      {/* チャット履歴エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain">
        <div className="sm:max-w-3xl sm:mx-auto w-full space-y-6">
          {isLoading ? (
            // Skeleton UI
            <div className="space-y-6 animate-pulse">
              <div className="flex justify-start">
                <div className="bg-blue-100 h-16 w-3/4 max-w-[85%] rounded-3xl rounded-tl-none"></div>
              </div>
            </div>
          ) : (
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
          {/* AIの返信待ちドット表示などをここに入れるとさらに可愛くなります */}
          {isSending && (
            <div className="flex justify-start animate-bounce">
              <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-400 font-bold">
                ...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 入力エリア */}
      <div className="p-4 bg-white border-t-2 border-blue-100 flex-shrink-0">
        <div className="flex gap-2 sm:max-w-3xl sm:mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                handleSend();
              }
            }}
            placeholder={isSending ? "AIが考え中..." : "メッセージを入力..."}
            disabled={isSending}
            className="flex-1 p-4 min-h-[44px] text-base rounded-2xl bg-gray-100 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-bold text-gray-700 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !inputText.trim()}
            className="min-h-[44px] min-w-[64px] bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 rounded-2xl font-black shadow-md transition-transform active:scale-95"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
};
