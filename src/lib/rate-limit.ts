import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Auth rate limiter: 5 attempts per 15 minutes
// Key: IP + identifier (phone) — mencegah brute force via rotating IP
export const authRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
})

// API rate limiter: 30 requests per minute
export const apiRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
})

// Burst limiter: 5 requests per second (mencegah rapid-fire)
export const burstRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 s'),
  analytics: true,
})

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'
}

// Composite key: IP + identifier untuk auth
// Mencegah brute force via rotating IP
export function getAuthKey(request: Request, identifier: string): string {
  const ip = getClientIp(request)
  return `auth:${ip}:${identifier}`
}
