import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError, errorResponse } from '@deckpipe/shared';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(errorResponse(err));
    return;
  }

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue.path.join('.');
    console.log(`[api] validation error: ${field}: ${issue.message}`);
    const apiError = new ApiError('validation_error', issue.message, field || undefined);
    res.status(400).json(errorResponse(apiError));
    return;
  }

  console.error('Unhandled error:', err);
  const apiError = new ApiError('server_error', 'Internal server error');
  res.status(500).json(errorResponse(apiError));
}
