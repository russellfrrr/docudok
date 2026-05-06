import { api } from './api';
import type { DocumentsResponse } from '@/types/document';

export const getDocuments = async (): Promise<DocumentsResponse> => {
  const response = await api.get<DocumentsResponse>('/documents');
  return response.data;
}