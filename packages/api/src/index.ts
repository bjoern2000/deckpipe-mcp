import fs from 'node:fs';
import { createApp } from './app.js';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';

async function main() {
  // Ensure image storage directory exists
  fs.mkdirSync(config.imageStoragePath, { recursive: true });

  // Run database migrations
  await runMigrations();

  // Start server
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`deckpipe API running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
