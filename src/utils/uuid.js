import crypto from 'crypto';

export function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuid && typeof uuid === 'string' && uuidRegex.test(uuid) && !uuid.includes('ticket-fallback');
}

export function generateUUID() {
  return crypto.randomUUID();
} 