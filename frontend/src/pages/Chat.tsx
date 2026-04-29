import { useState, useEffect, useRef } from "react"; // useRef を追加
import apiClient from "../api/apiClient";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // ✨ 自動スクロールのための「目印」
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // ✨ メッセージが増えたり、送信中ステータスが変わったら一番下までスクロール
  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]); // messages か isSending が変わるたびに実行

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

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputText,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText("");
    setIsSending(true);

    try {
      const response = await apiClient.post("/conversations", {
        message: currentInput,
      });

      const aiMsg: Message = {
        id: crypto.randomUUID(), // IDがない場合の保険
        role: "assistant",
        content: response.data.message,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("チャット通信エラー:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-blue-50">
      <header className="bg-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-sm border-b-2 border-blue-100 flex justify-between items-center z-10 flex-shrink-0">
        <h1 className="text-xl font-black text-blue-500">AI Partner 💬</h1>
        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold transition-all">
          {isSending ? "入力中..." : "オンライン"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain">
        <div className="sm:max-w-3xl sm:mx-auto w-full space-y-6">
          {isLoading ? (
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
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-400 font-bold animate-bounce">
                ...
              </div>
            </div>
          )}

          {/* ✨ ここに「目印」を配置 */}
          <div ref={scrollEndRef} />
        </div>
      </div>

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
