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

export interface DocumentResponse {
  document: Document;
}

export interface SourceSnippet {
  chunkText: string;
  chunkIndex: number;
  score: number;
}

export interface AskDocumentInput {
  question: string;
}

export interface AskDocumentResponse {
  answer: string;
  sources: SourceSnippet[];
}