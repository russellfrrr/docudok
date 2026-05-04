import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes';
import docsRouter from './routes/document.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'server is running' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/documents', docsRouter);

export default app;