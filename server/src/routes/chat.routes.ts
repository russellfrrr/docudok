import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createChat,
  getChatsByDocument,
  sendMessage,
} from '../controllers/chat.controller';

const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.post('/', createChat);
chatRouter.get('/:documentId', getChatsByDocument);
chatRouter.post('/:chatId/messages', sendMessage);

export default chatRouter;