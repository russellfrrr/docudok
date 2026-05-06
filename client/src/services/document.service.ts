import { api } from './api';
import type { DocumentsResponse, UploadDocumentResponse } from '@/types/document';

export const getDocuments = async (): Promise<DocumentsResponse> => {
  const response = await api.get<DocumentsResponse>('/documents');
  return response.data;
}

export const uploadDocument = async (
  file: File,
  title: string
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();

  formData.append('pdf', file);

  if (title.trim()) {
    formData.append('title', title.trim());
  }

  const response = await api.post<UploadDocumentResponse>(
    '/documents/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}