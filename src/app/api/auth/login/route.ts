import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createToken, setTokenCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { authRatelimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request)
  const { success, remaining, reset } = await authRatelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((reset - Date.now()) / 60000)} menit.` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Nomor telepon atau password salah' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      validatedData.password,
      user.password
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Nomor telepon atau password salah' },
        { status: 401 }
      )
    }

    // Create token and set cookie
    const token = await createToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })
    setTokenCookie(token)

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
