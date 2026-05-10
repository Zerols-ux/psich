import { PrismaClient } from '@prisma/client';
import { env } from '../env.js';

declare global {
  // eslint-disable-next-line no-var
  var __psichPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__psichPrisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__psichPrisma = prisma;
}
