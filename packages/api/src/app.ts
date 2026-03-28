import express from 'express';
import cors from 'cors';
import { decksRouter } from './routes/decks.js';
import { imagesRouter } from './routes/images.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Routes
  app.use('/v1/decks', decksRouter);
  app.use('/v1/images', imagesRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
