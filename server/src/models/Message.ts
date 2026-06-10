import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageSource {
  chunkText: string;
  chunkIndex: number;
  score: number;
  relevanceScore?: number;
  rerankScore?: number;
}

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  sources: IMessageSource[];
  createdAt: Date;
}

const messageSourceSchema = new Schema<IMessageSource>(
  {
    chunkText: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    relevanceScore: {
      type: Number,
    },
    rerankScore: {
      type: Number,
    },
  },
  {
    _id: false,
  }
);

const messageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sources: {
    type: [messageSourceSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);

export default MessageModel;
