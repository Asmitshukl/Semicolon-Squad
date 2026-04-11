import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, passwordHash: string) => {
  const [salt, storedHash] = passwordHash.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, KEY_LENGTH);
  const storedHashBuffer = Buffer.from(storedHash, 'hex');

  if (derivedHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, storedHashBuffer);
};
