// Shared TypeScript types for frontend and backend

export interface Message {
  _id?: string;
  conversationId?: string;
  userId?: string;
  role: 'user' | 'assistant';
  content: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  isOptimistic?: boolean;
  isStreaming?: boolean;
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  lastMessage: string;
  lastMessageAt: Date;
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  sessionId: string;
  lastActive: Date;
  createdAt: Date;
}

export interface ChatHistoryResponse {
  messages: Message[];
  conversationId: string | null;
  conversationTitle: string | null;
}

export interface SendMessageResponse {
  userMessage: Message;
  aiResponse: Message;
  conversationId: string;
}
