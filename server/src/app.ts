import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'server is running' });
});

app.use('/api/v1/auth', authRouter);

export default app;