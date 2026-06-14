import express from 'express';
import cors from 'cors';
import signsRouter from './routes/signs';
import statsRouter from './routes/stats';
import favoritesRouter from './routes/favorites';
import historyRouter from './routes/history';
import notesRouter from './routes/notes';
import { tagsRouter } from './routes/tags';
import './seed';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/signs', signsRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/tags', tagsRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/history', historyRouter);

  return app;
}

export default createApp;
