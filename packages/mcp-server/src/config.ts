import { config as dotenvConfig } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  apiUrl: process.env.DECKPIPE_API_URL || process.env.API_URL || 'https://deckpipe.com',
};
