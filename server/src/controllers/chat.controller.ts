import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import ChatModel from '../models/Chat';
import MessageModel from '../models/Message';
import DocumentModel from '../models/Document';
import { createEmbedding } from '../services/embedding.service';
import { searchDocumentChunks } from '../services/vector.service'; 
import { generateAnswer } from '../services/ai.service';

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { documentId, title } = req.body;

    if (!documentId) {
      return res.status(400).json({ message: 'documentId is required' });
    }

    const document = await DocumentModel.findOne({
      _id: documentId,
      userId: req.user.id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or not ready' });
    }

    const chat = await ChatModel.create({
      userId: req.user.id,
      documentId,
      title: title || document.title,
    });

    res.status(201).json({ chat });
  } catch (err) {
    console.error('Create chat failed', err);
    res.status(500).json({ message: 'Create chat failed' });
  }
}

export const getChatsByDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const chats = await ChatModel.find({
      userId: req.user.id,
      documentId: req.params.documentId,
    }).sort({ createdAt: -1 });

    res.json({ chats });
  } catch (err) {
    console.error('Get chats failed', err);
    res.status(500).json({ message: 'Get chats failed' });
  }
}

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const chat = await ChatModel.findOne({
      _id: req.params.chatId,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const document = await DocumentModel.findOne({
      _id: chat.documentId,
      userId: req.user.id,
      status: 'ready',
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or not ready' });
    }

    const userMessage = await MessageModel.create({
      chatId: chat._id,
      role: 'user',
      content,
      sources: [],
    });

    const questionVector = await createEmbedding(content);

    const sources = await searchDocumentChunks(
      questionVector,
      req.user.id,
      document._id.toString(),
      5
    );

    const answer = await generateAnswer(content, sources);

    const assistantMessage = await MessageModel.create({
      chatId: chat._id,
      role: 'assistant',
      content: answer,
      sources,
    });

    res.status(201).json({ userMessage, assistantMessage });
  } catch (err) {
    console.error('Send message failed', err);
    res.status(500).json({ message: 'Send message failed' });
  }
};

export const getMessagesByChat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const chat = await ChatModel.findOne({
      _id: req.params.chatId,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await MessageModel.find({
      chatId: chat._id,
    }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    console.error('Get messages failed', err);
    res.status(500).json({ message: 'Get messages failed' });
  }
};