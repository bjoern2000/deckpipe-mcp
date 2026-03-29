import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decksRouter } from './routes/decks.js';
import { imagesRouter } from './routes/images.js';
import { errorHandler } from './middleware/error-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  // Serve viewer static files in production
  const viewerDist = path.resolve(__dirname, '../../viewer/dist');
  if (fs.existsSync(viewerDist)) {
    // Landing page at root
    const landingPage = path.join(viewerDist, 'landing.html');
    if (fs.existsSync(landingPage)) {
      app.get('/', (_req, res) => {
        res.sendFile(landingPage);
      });
    }

    app.use(express.static(viewerDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(viewerDist, 'index.html'));
    });
  }

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
