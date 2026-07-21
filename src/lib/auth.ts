import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET)

export interface JWTPayload {
  userId: string
  phone: string
  role: 'GURU' | 'ORANG_TUA' | 'OWNER'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'], // Enforce algorithm
    })

    // Validate expiry explicitly
    if (!payload.exp) {
      return null
    }

    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  return verifyToken(token)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
      },
    })

    if (user && user.role === 'OWNER' && user.status !== 'APPROVED') {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'APPROVED' },
      })
      user.status = 'APPROVED'
    }

    // User not found in DB (e.g. after DB reset) — clear stale cookie
    if (!user) {
      await clearTokenCookie()
      return null
    }

    return user
  } catch (err) {
    console.error('Prisma error in getCurrentUser:', err)
    return null
  }
}

export async function setTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // 'strict' menyebabkan cookie tidak dikirim saat redirect → redirect loop
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: '/',
  })
}

export async function clearTokenCookie() {
  const cookieStore = await cookies()
  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}
