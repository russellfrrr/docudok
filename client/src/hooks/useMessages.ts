import { useQuery } from '@tanstack/react-query';
import { getMessagesByChat } from '@/services';

export const useMessages = (chatId: string | null) => {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => getMessagesByChat(chatId || ''),
    enabled: Boolean(chatId),
  });
};
