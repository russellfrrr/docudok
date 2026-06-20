import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>({
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
  title: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

chatSchema.index({ userId: 1, documentId: 1, createdAt: -1 });

const ChatModel = mongoose.model<IChat>('Chat', chatSchema);

export default ChatModel;
