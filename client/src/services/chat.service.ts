import { api } from './api';
import type {
  ChatsResponse,
  CreateChatInput,
  CreateChatResponse,
  MessagesResponse,
  SendMessageInput,
  SendMessageResponse,
} from '@/types/chat';

export const createChat = async (
  input: CreateChatInput
): Promise<CreateChatResponse> => {
  const response = await api.post<CreateChatResponse>('/chats', input);
  return response.data;
}

export const getChatsByDocument = async (
  documentId: string
): Promise<ChatsResponse> => {
  const response = await api.get<ChatsResponse>(`/chats/${documentId}`);
  return response.data;
}

export const getMessagesByChat = async (
  chatId: string
): Promise<MessagesResponse> => {
  const response = await api.get<MessagesResponse>(`/chats/${chatId}/messages`);
  return response.data;
}

export const sendMessage = async (
  input: SendMessageInput
): Promise<SendMessageResponse> => {
  const response = await api.post<SendMessageResponse>(`/chats/${input.chatId}/messages`, 
    {
      content: input.content,
    }
  );

  return response.data;
}