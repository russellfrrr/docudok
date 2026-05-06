export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface Document {
  _id: string;
  userId: string;
  title: string;
  fileName: string;
  status: DocumentStatus;
  totalChunks: number;
  createdAt: string;
}

export interface DocumentsResponse {
  documents: Document[];
}

export interface UploadDocumentResponse {
  document: Document;
  chunksPreview?: string[];
}