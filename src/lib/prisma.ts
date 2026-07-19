import { PrismaClient } from '@prisma/client'

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Build a DATABASE_URL that includes a short connect_timeout so that
 * cold-start latency on Neon Serverless fails fast (< Vercel's 10-second
 * function limit) instead of hanging until Vercel kills the process.
 *
 * connect_timeout=8  → PostgreSQL wire protocol timeout (seconds)
 * pool_timeout=8     → Prisma connection pool wait timeout (seconds)
 */
function buildDatasourceUrl(): string {
  const raw = process.env.DATABASE_URL!
  try {
    const url = new URL(raw)
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '8')
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '8')
    }
    return url.toString()
  } catch {
    // If URL parsing fails, return original value unchanged
    return raw
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: buildDatasourceUrl() },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
