import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';
import { generateImageId } from '@deckpipe/shared';
import { config } from '../config.js';
import { query } from '../db/client.js';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function extFromContentType(ct: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  return map[ct] || 'png';
}

async function detectFocalPoint(buffer: Buffer): Promise<{ x: number; y: number }> {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1;
    const height = metadata.height || 1;
    const result = await smartcrop.crop(buffer, { width: 100, height: 100 });
    const crop = result.topCrop;
    const x = Math.min(1, Math.max(0, (crop.x + crop.width / 2) / width));
    const y = Math.min(1, Math.max(0, (crop.y + crop.height / 2) / height));
    return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
  } catch {
    return { x: 0.5, y: 0.5 };
  }
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

  const focus = await detectFocalPoint(file.buffer);

  return {
    image_id: imageId,
    url: `${config.apiUrl}/v1/images/${filename}`,
    size_bytes: file.size,
    content_type: file.mimetype,
    focus,
  };
}
