import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to start the backend.');
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma__ = prisma;
}
