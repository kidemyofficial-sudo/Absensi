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
    .setExpirationTime('2h') // Dikurangi dari 7 hari ke 2 jam
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

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
    },
  })

  // User not found in DB (e.g. after DB reset) — clear stale cookie
  if (!user) {
    await clearTokenCookie()
    return null
  }

  return user
}

export async function setTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: true, // Selalu true — tidak conditional
    sameSite: 'strict', // Ubah dari 'lax' ke 'strict'
    maxAge: 60 * 60 * 2, // 2 jam (dikurangi dari 7 hari)
    path: '/',
  })
}

export async function clearTokenCookie() {
  const cookieStore = await cookies()
  cookieStore.set('token', '', {
    httpOnly: true,
    secure: true, // Selalu true
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}
