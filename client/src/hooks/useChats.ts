import { useQuery } from '@tanstack/react-query';
import { getChatsByDocument } from '@/services/chat.service';

export const useChats = (documentId: string | undefined) => {
  return useQuery({
    queryKey: ['chats', documentId],
    queryFn: () => getChatsByDocument(documentId || ''),
    enabled: Boolean(documentId),
  });
};