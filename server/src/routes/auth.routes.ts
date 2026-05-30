import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rate-limit.middleware';

const authRouter = Router();

authRouter.post('/register', authRateLimit, register);
authRouter.post('/login', authRateLimit, login);
authRouter.get('/me', authMiddleware, me);

export default authRouter;
