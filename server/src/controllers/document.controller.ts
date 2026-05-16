import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import DocumentModel from '../models/Document';
import DocumentChunkModel from '../models/DocumentChunk';
import ChatModel from '../models/Chat';
import MessageModel from '../models/Message';
import { deleteDocumentVectors } from '../services/vector.service';
import { generateAnswer } from '../services/ai.service';
import { processDocument } from '../services/document-processing.service';
import { retrieveDocumentSources } from '../services/retrieval.service';


export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authorized'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'PDF file is required',
      });
    }

    const title = req.body.title || req.file.originalname;
    const filePath = path.join('uploads', req.file.filename);

    const document = await DocumentModel.create({
      userId: req.user.id,
      title,
      fileName: req.file.filename,
      status: 'processing',
      totalChunks: 0,
    });

    processDocument({
      documentId: document._id.toString(),
      userId: req.user.id,
      filePath,
    }).catch((err) => {
      console.error('Background document processing failed', err);
    });

    res.status(201).json({ document });
  } catch (err) {
    console.error('Upload document failed', err);
    res.status(500).json({ message: 'Upload document failed' });
  }
}

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const documents = await DocumentModel.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.json({ documents });
  } catch (err) {
    console.error('Get documents failed', err);
    res.status(500).json({ message: 'Get documents failed '});
  }
}

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const document = await DocumentModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ document });
  } catch (err) {
    console.error('Get document failed', err);
    res.status(500).json({ message: 'Get document failed' });
  }
}

export const retryDocumentProcessing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const document = await DocumentModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status === 'processing') {
      return res.status(409).json({ message: 'Document is already processing' });
    }

    if (document.status === 'ready') {
      return res.status(400).json({ message: 'Document is already ready' });
    }

    const filePath = path.join('uploads', document.fileName);

    if (!fs.existsSync(filePath)) {
      document.status = 'failed';
      await document.save();

      return res.status(404).json({ message: 'Uploaded file not found' });
    }

    document.status = 'processing';
    document.totalChunks = 0;
    await document.save();

    processDocument({
      documentId: document._id.toString(),
      userId: req.user.id,
      filePath,
    }).catch((err) => {
      console.error('Retry document processing failed', err);
    });

    res.json({ document });
  } catch (err) {
    console.error('Retry document processing failed', err);
    res.status(500).json({ message: 'Retry document processing failed' });
  }
}

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const document = await DocumentModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const chats = await ChatModel.find({
      documentId: document._id,
      userId: req.user.id,
    });

    const chatIds = chats.map((chat) => chat._id);

    await MessageModel.deleteMany({
      chatId: {
        $in: chatIds,
      },
    });

    await ChatModel.deleteMany({
      documentId: document._id,
      userId: req.user.id,
    });

    await DocumentChunkModel.deleteMany({
      documentId: document._id,
      userId: req.user.id,
    });

    await deleteDocumentVectors(req.user.id, document._id.toString());

    const filePath = path.join('uploads', document.fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete document failed', err);
    res.status(500).json({ message: 'Delete document failed' });
  }
}

export const searchDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const document = await DocumentModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'ready',
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or not ready '});
    }

    const sources = await retrieveDocumentSources({
      question,
      userId: req.user.id,
      documentId: document._id.toString(),
    });

    res.json({ sources });
  } catch (err) {
    console.error('Search document failed', err);
    res.status(500).json({ message: 'Search document failed' });
  }
}

export const askDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const document = await DocumentModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'ready',
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or not ready' });
    }

    const sources = await retrieveDocumentSources({
      question,
      userId: req.user.id,
      documentId: document._id.toString(),
    });

    const answer = await generateAnswer(question, sources);

    res.json({ answer, sources });
  } catch (err) {
    console.error('Ask document failed', err);
    res.status(500).json({ message: 'Ask document failed '});
  }
}
