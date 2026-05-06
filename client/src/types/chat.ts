import type { SourceSnippet } from './document';

export interface Chat {
  _id: string;
  userId: string;
  documentId: string;
  title: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  sources: SourceSnippet[];
  createdAt: string;
}

export interface ChatsResponse {
  chats: Chat[];
}

export interface CreateChatInput {
  documentId: string;
  title?: string;
}

export interface CreateChatResponse {
  chat: Chat;
}

export interface MessagesResponse {
  messages: Message[];
}

export interface SendMessageInput {
  chatId: string;
  content: string;
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}