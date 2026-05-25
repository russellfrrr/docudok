import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  fileName: string;
  status: 'processing' | 'ready' | 'failed';
  processingError?: string;
  totalChunks: number;
  createdAt: Date;
}

const documentSchema = new Schema<IDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
  },
  processingError: {
    type: String,
    default: '',
  },
  totalChunks: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, status: 1 });

const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

export default DocumentModel;
