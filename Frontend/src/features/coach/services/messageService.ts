import { MockApiError } from "../../../services/mock/latency";
import type { ChatMessage, Conversation, SendMessageInput } from "../types";
import { CONVERSATIONS, MESSAGES } from "../mock/communication.mock";
import { newId } from "../mock/helpers";
import { COACH_ENDPOINTS, USE_MOCK_API, api, mockResponse } from "./http";

export const messageService = {
  async getConversations(): Promise<Conversation[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.conversations);
    return mockResponse([...CONVERSATIONS].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)), 350);
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!USE_MOCK_API) return api.get(COACH_ENDPOINTS.conversationMessages(conversationId));
    return mockResponse(MESSAGES.filter((m) => m.conversationId === conversationId).sort((a, b) => a.sentAt.localeCompare(b.sentAt)), 300);
  },

  async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.conversationMessages(input.conversationId), input);
    const conversation = CONVERSATIONS.find((c) => c.id === input.conversationId);
    if (!conversation) throw new MockApiError("Không tìm thấy cuộc trò chuyện.", 404);
    const message: ChatMessage = {
      id: newId("msg"),
      conversationId: input.conversationId,
      sender: "COACH",
      kind: input.kind,
      content: input.content,
      attachment: input.attachment ?? null,
      sentAt: new Date().toISOString(),
      read: true,
    };
    MESSAGES.push(message);
    conversation.lastMessage = input.content;
    conversation.lastMessageAt = message.sentAt;
    return mockResponse(message, 300);
  },

  async markConversationRead(conversationId: string): Promise<void> {
    if (!USE_MOCK_API) return api.post(COACH_ENDPOINTS.conversationRead(conversationId));
    MESSAGES.forEach((m) => {
      if (m.conversationId === conversationId) m.read = true;
    });
    const conversation = CONVERSATIONS.find((c) => c.id === conversationId);
    if (conversation) conversation.unreadCount = 0;
    return mockResponse(undefined, 150);
  },
};
