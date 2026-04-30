import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiRequest, ApiClientError } from "../lib/apiClient";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
};

type ListMessagesResponse = {
  messages: ChatMessage[];
};

type SendMessageResponse = {
  message: ChatMessage;
};

const DEMO_CONVERSATION_ID = "demo-conversation";

function nowIso(): string {
  return new Date().toISOString();
}

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      try {
        const data = await apiRequest<ListMessagesResponse>(
          `/api/chat/${DEMO_CONVERSATION_ID}/messages`,
        );

        if (active) {
          setMessages(data.messages);
        }
      } catch (loadError) {
        if (active) {
          const message =
            loadError instanceof ApiClientError
              ? loadError.message
              : "履歴の取得に失敗しました";
          setError(message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadMessages();

    return () => {
      active = false;
    };
  }, []);

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();
    if (!content || isSending) {
      return;
    }

    setError(null);
    setIsSending(true);

    const optimisticUserMessage: ChatMessage = {
      id: `local-${crypto.randomUUID()}`,
      role: "user",
      content,
      createdAt: nowIso(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput("");

    try {
      const data = await apiRequest<SendMessageResponse>(
        `/api/chat/${DEMO_CONVERSATION_ID}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
      );

      setMessages((prev) => [...prev, data.message]);
    } catch (sendError) {
      setMessages((prev) =>
        prev.filter((message) => message.id !== optimisticUserMessage.id),
      );

      const message =
        sendError instanceof ApiClientError
          ? sendError.message
          : "送信に失敗しました";
      setError(message);
      setInput(content);
    } finally {
      setIsSending(false);
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
            <>
              {messages.map((msg) => (
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
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 p-4 rounded-3xl rounded-tl-none shadow-sm border-2 border-transparent font-bold">
                    送信中...
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t-2 border-blue-100 flex-shrink-0">
        <form className="flex gap-2 sm:max-w-3xl sm:mx-auto" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="メッセージを入力..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="flex-1 p-4 min-h-[44px] text-base rounded-2xl bg-gray-100 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-bold text-gray-700"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="min-h-[44px] min-w-[64px] bg-blue-500 enabled:hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 rounded-2xl font-black shadow-md transition-transform enabled:active:scale-95"
          >
            送信
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-500 font-bold">{error}</p>}
      </div>
    </div>
  );
};
