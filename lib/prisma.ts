import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Fail faster on Vercel instead of hanging the login button forever
    datasources: process.env.DATABASE_URL
      ? {
          db: {
            url: process.env.DATABASE_URL.includes('serverSelectionTimeoutMS')
              ? process.env.DATABASE_URL
              : `${process.env.DATABASE_URL}${
                  process.env.DATABASE_URL.includes('?') ? '&' : '?'
                }serverSelectionTimeoutMS=8000&connectTimeoutMS=8000`,
          },
        }
      : undefined,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
