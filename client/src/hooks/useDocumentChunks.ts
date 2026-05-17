import { useQuery } from '@tanstack/react-query';
import { getDocumentChunks } from '@/services/document.service';

export const useDocumentChunks = (
  documentId: string | undefined,
  enabled = true
) => {
  return useQuery({
    queryKey: ['document-chunks', documentId],
    queryFn: () => getDocumentChunks(documentId || ''),
    enabled: Boolean(documentId) && enabled,
  });
};
