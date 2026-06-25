import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '@/services';

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
    refetchInterval: (query) => {
      const documents = query.state.data?.documents || [];

      const hasProcessingDocument = documents.some((document) => {
        return document.status === 'processing';
      });

      return hasProcessingDocument ? 3000 : false;
    },
  });
};
