import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createToken, setTokenCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { authRatelimit, getAuthKey } from '@/lib/rate-limit'
import { logAudit, getIp } from '@/lib/audit'

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Rate limiting dengan composite key (IP + phone)
    const authKey = getAuthKey(request, validatedData.phone)
    const { success, reset } = await authRatelimit.limit(authKey)

    if (!success) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((reset - Date.now()) / 60000)} menit.` },
        { status: 429 }
      )
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
      select: {
        id: true, name: true, phone: true, role: true, password: true,
        failedLoginAttempts: true, lockedUntil: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Nomor telepon atau password salah' },
        { status: 401 }
      )
    }

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Akun terkunci. Coba lagi dalam ${minutesLeft} menit.` },
        { status: 423 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)

    if (!isValidPassword) {
      // Increment failed attempts
      const attempts = user.failedLoginAttempts + 1
      const lockUntil = attempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        : null

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil: lockUntil },
      })

      // Audit log: login gagal
      await logAudit({
        userId: user.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        newData: { event: 'login_failed', attempts, locked: !!lockUntil },
        ip: getIp(request),
      })

      if (lockUntil) {
        return NextResponse.json(
          { error: `Terlalu banyak percobaan gagal. Akun terkunci selama ${LOCKOUT_MINUTES} menit.` },
          { status: 423 }
        )
      }

      return NextResponse.json(
        { error: 'Nomor telepon atau password salah' },
        { status: 401 }
      )
    }

    // Login berhasil — reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })

    // Audit log: login berhasil
    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      newData: { event: 'login_success' },
      ip: getIp(request),
    })

    // Create token and set cookie
    const token = await createToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })
    await setTokenCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      )
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
