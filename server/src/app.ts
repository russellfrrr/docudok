import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes';
import docsRouter from './routes/document.routes';
import chatRouter from './routes/chat.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { securityMiddleware } from './middleware/security.middleware';

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(requestIdMiddleware);
app.use(securityMiddleware);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    message: 'server is running',
    service: 'docudok-api',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round(process.uptime()),
    requestId: res.locals.requestId,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/documents', docsRouter);
app.use('/api/v1/chats', chatRouter);
app.use(errorMiddleware);

export default app;
