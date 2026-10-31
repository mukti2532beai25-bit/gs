import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prismaClient ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma;
}

export interface DbStatus {
  isConnected: boolean;
  provider: string;
  error?: string;
}

export async function checkDatabaseConnection(): Promise<DbStatus> {
  try {
    // Perform real ping
    await prisma.$queryRawUnsafe('SELECT 1');
    return {
      isConnected: true,
      provider: 'postgresql',
    };
  } catch (error: any) {
    return {
      isConnected: false,
      provider: 'postgresql',
      error: error.message || 'Unable to connect to PostgreSQL database.',
    };
  }
}
