export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "EMAIL_EXISTS"
  | "INTERNAL_ERROR";

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type EmotionLabel = "joy" | "sadness" | "anger" | "fear" | "neutral";

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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  emotionScore: EmotionScore | null;
  createdAt: string;
  sources: ChatSource[];
}

export interface ConversationSummary {
  id: string;
  startedAt: string;
  lastMessageAt: string;
}
