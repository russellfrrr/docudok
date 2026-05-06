import { useQuery } from '@tanstack/react-query';
import { getMessagesByChat } from '@/services/chat.service';

export const useMessages = (chatId: string | null) => {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => getMessagesByChat(chatId || ''),
    enabled: Boolean(chatId),
  });
};