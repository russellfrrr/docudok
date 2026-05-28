import type { Document } from '@/types/document';

export const getDocumentFailureMessage = (document: Document): string => {
  return document.processingError || 'Processing failed. Retry from the dashboard.';
};

export const getDocumentStatusSummary = (document: Document): string => {
  if (document.status === 'ready') {
    return `${document.totalChunks} chunks`;
  }

  if (document.status === 'processing') {
    return 'Processing document';
  }

  return 'Upload failed';
};
