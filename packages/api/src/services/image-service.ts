import fs from 'node:fs';
import path from 'node:path';
import { generateImageId } from '@deckpipe/shared';
import { config } from '../config.js';
import { query } from '../db/client.js';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function extFromContentType(ct: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  return map[ct] || 'png';
}

export async function saveUploadedImage(file: Express.Multer.File) {
  const imageId = generateImageId();
  const ext = extFromContentType(file.mimetype);
  const filename = `${imageId}.${ext}`;
  const filepath = path.join(config.imageStoragePath, filename);

  fs.writeFileSync(filepath, file.buffer);

  await query(
    'INSERT INTO images (image_id, original_filename, content_type, size_bytes) VALUES ($1, $2, $3, $4)',
    [imageId, file.originalname, file.mimetype, file.size]
  );

  return {
    image_id: imageId,
    url: `${config.apiUrl}/v1/images/${filename}`,
    size_bytes: file.size,
    content_type: file.mimetype,
  };
}

export async function rehostExternalImage(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type')?.split(';')[0] || '';
    if (!ALLOWED_TYPES.includes(contentType)) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_SIZE) return null;

    const imageId = generateImageId();
    const ext = extFromContentType(contentType);
    const filename = `${imageId}.${ext}`;
    const filepath = path.join(config.imageStoragePath, filename);

    fs.writeFileSync(filepath, buffer);

    await query(
      'INSERT INTO images (image_id, original_filename, content_type, size_bytes) VALUES ($1, $2, $3, $4)',
      [imageId, imageUrl, contentType, buffer.length]
    );

    return `${config.apiUrl}/v1/images/${filename}`;
  } catch {
    return null;
  }
}

function isExternalUrl(url: string): boolean {
  return url.startsWith('http') && !url.startsWith(config.apiUrl);
}

export async function rehostImagesInDeck(slides: unknown[]): Promise<unknown[]> {
  const result = JSON.parse(JSON.stringify(slides));

  for (const slide of result) {
    const content = (slide as { content: Record<string, unknown> }).content;
    if (content.image_url && typeof content.image_url === 'string' && isExternalUrl(content.image_url)) {
      const newUrl = await rehostExternalImage(content.image_url);
      if (newUrl) {
        content.image_url = newUrl;
      }
    }
  }

  return result;
}
