import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { ApiError } from '@deckpipe/shared';
import { uploadImageLimiter } from '../middleware/rate-limiter.js';
import { saveUploadedImage } from '../services/image-service.js';
import { config } from '../config.js';

const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError('validation_error', `Unsupported file type '${file.mimetype}'. Must be PNG, JPG, or WebP.`, 'file'));
    }
  },
});

export const imagesRouter = Router();

// POST /v1/images — Upload an image
imagesRouter.post('/', uploadImageLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError('validation_error', 'No file provided', 'file');
    }

    const result = await saveUploadedImage(req.file);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /v1/images/:filename — Serve an image
imagesRouter.get('/:filename', (req, res) => {
  const filepath = path.join(config.imageStoragePath, req.params.filename);
  res.sendFile(path.resolve(filepath), (err) => {
    if (err) {
      res.status(404).json({
        error: { code: 'not_found', message: `Image '${req.params.filename}' not found` },
      });
    }
  });
});
