import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  deleteDocument,
  getDocumentById,
  getDocumentChunks,
  getDocuments,
  uploadDocument,
  searchDocument,
  askDocument,
  retryDocumentProcessing,
} from '../controllers/document.controller';

const docsRouter = Router();

docsRouter.use(authMiddleware);

docsRouter.post('/upload', upload.single('pdf'), uploadDocument);
docsRouter.get('/', getDocuments);
docsRouter.post('/:id/retry', retryDocumentProcessing);
docsRouter.post('/:id/search', searchDocument);
docsRouter.post('/:id/ask', askDocument);
docsRouter.get('/:id/chunks', getDocumentChunks);
docsRouter.get('/:id', getDocumentById);
docsRouter.delete('/:id', deleteDocument);

export default docsRouter;
