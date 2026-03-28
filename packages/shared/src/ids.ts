import crypto from 'node:crypto';

function randomId(length: number): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

export function generateDeckId(): string {
  return `dk_${randomId(8)}`;
}

export function generateImageId(): string {
  return `img_${randomId(8)}`;
}
