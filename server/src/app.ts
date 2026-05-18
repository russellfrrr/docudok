import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes';
import docsRouter from './routes/document.routes';
import chatRouter from './routes/chat.routes';

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    message: 'server is running',
    service: 'docudok-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/documents', docsRouter);
app.use('/api/v1/chats', chatRouter);

export default app;
