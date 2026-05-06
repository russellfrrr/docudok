import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '@/services/document.service';

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });
};