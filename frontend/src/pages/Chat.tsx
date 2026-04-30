import { useEffect, useMemo, useState, type KeyboardEventHandler } from "react";
import { createChat, getChatHistory, sendChatMessage } from "../api/chat";
import { ApiClientError } from "../api/client";
import type { ChatMessage } from "../types/api";

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const makeLocalId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      try {
        const conversation = await createChat();
        if (!mounted) return;
        setConversationId(conversation.id);
        const history = await getChatHistory(conversation.id);
        if (!mounted) return;
        setMessages(history);
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof ApiClientError ? error.message : "チャットの読み込みに失敗しました。");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void boot();
    return () => {
      mounted = false;
    };
  }, []);

  const canSend = useMemo(
    () => !isSending && Boolean(input.trim()) && Boolean(conversationId),
    [conversationId, input, isSending],
  );

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !conversationId) return;
    setInput("");
    setErrorMessage(null);
    const localUserMessage: ChatMessage = {
      id: makeLocalId(),
      role: "user",
      content,
      emotionScore: null,
      createdAt: new Date().toISOString(),
      sources: [],
    };
    setMessages((prev) => [...prev, localUserMessage]);
    setIsSending(true);
    try {
      const assistant = await sendChatMessage(conversationId, content);
      setMessages((prev) => [...prev, assistant]);
    } catch (error) {
      setErrorMessage(error instanceof ApiClientError ? error.message : "メッセージ送信に失敗しました。");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputEnter: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-blue-50">
      <header className="bg-white p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-sm border-b-2 border-blue-100 flex justify-between items-center z-10 flex-shrink-0">
        <h1 className="text-xl font-black text-blue-500">AI Partner 💬</h1>
        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
          オンライン
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain">
        <div className="sm:max-w-3xl sm:mx-auto w-full space-y-6">
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm font-semibold">
              {errorMessage}
            </div>
          )}
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
                  {msg.role === "assistant" && msg.sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.sources.map((source) => (
                        <a
                          key={source.id}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl border border-blue-200 bg-blue-50 p-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <p className="font-bold">{source.title}</p>
                          <p className="line-clamp-2">{source.snippet}</p>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t-2 border-blue-100 flex-shrink-0">
        <div className="flex gap-2 sm:max-w-3xl sm:mx-auto">
          <input
            type="text"
            placeholder="メッセージを入力..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputEnter}
            className="flex-1 p-4 min-h-[44px] text-base rounded-2xl bg-gray-100 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-bold text-gray-700"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="min-h-[44px] min-w-[64px] bg-blue-500 disabled:bg-blue-300 hover:bg-blue-600 text-white px-6 rounded-2xl font-black shadow-md transition-transform active:scale-95"
          >
            {isSending ? "送信中" : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
};
