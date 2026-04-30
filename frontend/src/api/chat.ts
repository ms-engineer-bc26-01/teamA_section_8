import { apiFetch } from "./client";
import type { ChatMessage, ConversationSummary } from "../types/api";

interface CreateChatResponse {
  conversation: ConversationSummary;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
}

interface SendMessageResponse {
  message: ChatMessage;
}

export async function createChat(): Promise<ConversationSummary> {
  const res = await apiFetch<CreateChatResponse>("/chat", {
    method: "POST",
  });
  return res.conversation;
}

export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  const res = await apiFetch<ChatHistoryResponse>(`/chat/${conversationId}/history`);
  return res.messages;
}

export async function sendChatMessage(conversationId: string, content: string): Promise<ChatMessage> {
  const res = await apiFetch<SendMessageResponse>(`/chat/${conversationId}/message`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return res.message;
}
