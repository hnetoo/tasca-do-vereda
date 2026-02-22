import crypto from 'crypto';

export function calculateHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
