import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentChunk extends Document {
  userId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  chunkText: string;
  chunkIndex: number;
  createdAt: Date;
}

const documentChunkSchema = new Schema<IDocumentChunk>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  chunkText: {
    type: String,
    required: true,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const DocumentChunkModel = mongoose.model<IDocumentChunk>(
  'DocumentChunk',
  documentChunkSchema
);

export default DocumentChunkModel;