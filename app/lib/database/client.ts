import { PrismaClient } from './generated';

// Create a global variable to store the Prisma client
declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances during development hot reloads
const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };
export * from './generated';