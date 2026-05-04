import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import DocumentModel from '../models/Document';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'PDF file is required',
      })
    };

    const title = req.body.title || req.file.originalname;

    const document = await DocumentModel.create({
      userId: req.user.id,
      title,
      fileName: req.file.filename,
      status: 'processing',
      totalChunks: 0,
    });

    res.status(201).json({ document });
  } catch (err) {
    console.error('Upload document failed', err);
    res.status(500).json({ message: 'Upload document failed '});
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

    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete document failed', err);
    res.status(500).json({ message: 'Delete document failed' });
  }
}