export type ChatRole = 'user' | 'assistant' | 'system';

export type EmotionLabel = 'joy' | 'sadness' | 'anger' | 'fear' | 'neutral';

export interface EmotionScore {
  label: EmotionLabel;
  score: number;
  categories: string[];
}

export interface ChatSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  provider: string;
}

export interface ChatMessageResponse {
  id: string;
  role: ChatRole;
  content: string;
  emotionScore: EmotionScore | null;
  createdAt: string;
  sources: ChatSource[];
}

export interface CreateChatResponseBody {
  conversation: {
    id: string;
    startedAt: string;
    lastMessageAt: string;
  };
}

export interface SendChatMessageResponseBody {
  message: ChatMessageResponse;
}

export interface GetChatHistoryResponseBody {
  messages: ChatMessageResponse[];
}
