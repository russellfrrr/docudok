import fs from 'fs/promises';
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
import {
  DocumentValidationError,
  validateDocumentTitle,
  validateQuestion,
} from '../utils/document-validation';
import { countWords } from '../utils/text-stats';

const getUploadedFilePath = (fileName: string) => {
  return path.join('uploads', fileName);
};

const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const deleteFileIfExists = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;

    if (error.code !== 'ENOENT') {
      throw err;
    }
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'PDF file is required',
      });
    }

    const title = validateDocumentTitle(req.body.title, req.file.originalname);
    const filePath = getUploadedFilePath(req.file.filename);

    const document = await DocumentModel.create({
      userId: req.user.id,
      title,
      fileName: req.file.filename,
      status: 'processing',
      processingError: '',
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
    if (err instanceof DocumentValidationError) {
      return res.status(400).json({ message: err.message });
    }

    console.error('Upload document failed', err);
    return res.status(500).json({ message: 'Upload document failed' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const documents = await DocumentModel.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    return res.json({ documents });
  } catch (err) {
    console.error('Get documents failed', err);
    return res.status(500).json({ message: 'Get documents failed' });
  }
};

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

    return res.json({ document });
  } catch (err) {
    console.error('Get document failed', err);
    return res.status(500).json({ message: 'Get document failed' });
  }
};

export const getDocumentChunks = async (req: AuthRequest, res: Response) => {
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

    const chunks = await DocumentChunkModel.find({
      documentId: document._id,
      userId: req.user.id,
    }).sort({ chunkIndex: 1 });

    const totalCharacters = chunks.reduce((total, chunk) => {
      return total + chunk.chunkText.length;
    }, 0);

    const totalWords = chunks.reduce((total, chunk) => {
      return total + countWords(chunk.chunkText);
    }, 0);

    const stats = {
      totalChunks: chunks.length,
      totalCharacters,
      totalWords,
      averageChunkLength:
        chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0,
      averageChunkWords:
        chunks.length > 0 ? Math.round(totalWords / chunks.length) : 0,
    };

    return res.json({ chunks, stats });
  } catch (err) {
    console.error('Get document chunks failed', err);
    return res.status(500).json({ message: 'Get document chunks failed' });
  }
};

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

    const filePath = getUploadedFilePath(document.fileName);

    if (!(await fileExists(filePath))) {
      document.status = 'failed';
      document.processingError = 'Uploaded file not found';
      await document.save();

      return res.status(404).json({ message: 'Uploaded file not found' });
    }

    document.status = 'processing';
    document.processingError = '';
    document.totalChunks = 0;
    await document.save();

    processDocument({
      documentId: document._id.toString(),
      userId: req.user.id,
      filePath,
    }).catch((err) => {
      console.error('Retry document processing failed', err);
    });

    return res.json({ document });
  } catch (err) {
    console.error('Retry document processing failed', err);
    return res.status(500).json({ message: 'Retry document processing failed' });
  }
};

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

    const filePath = getUploadedFilePath(document.fileName);
    await deleteFileIfExists(filePath);

    return res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete document failed', err);
    return res.status(500).json({ message: 'Delete document failed' });
  }
};

export const searchDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const question = validateQuestion(req.body);

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

    return res.json({ sources });
  } catch (err) {
    if (err instanceof DocumentValidationError) {
      return res.status(400).json({ message: err.message });
    }

    console.error('Search document failed', err);
    return res.status(500).json({ message: 'Search document failed' });
  }
};

export const askDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const question = validateQuestion(req.body);

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

    return res.json({ answer, sources });
  } catch (err) {
    if (err instanceof DocumentValidationError) {
      return res.status(400).json({ message: err.message });
    }

    console.error('Ask document failed', err);
    return res.status(500).json({ message: 'Ask document failed' });
  }
};
