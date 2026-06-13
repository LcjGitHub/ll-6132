import express from 'express';
import cors from 'cors';
import signsRouter from './routes/signs';
import statsRouter from './routes/stats';
import favoritesRouter from './routes/favorites';
import './seed';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/signs', signsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/favorites', favoritesRouter);

app.listen(PORT, () => {
  console.log(`后端服务运行于 http://localhost:${PORT}`);
});
