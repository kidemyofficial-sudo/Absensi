import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createToken, setTokenCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { authRatelimit, getAuthKey } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Rate limiting dengan composite key (IP + phone)
    const authKey = getAuthKey(request, validatedData.phone)
    const { success, reset } = await authRatelimit.limit(authKey)

    if (!success) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((reset - Date.now()) / 60000)} menit.` },
        { status: 429 }
      )
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Nomor telepon sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(validatedData.password)
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        password: hashedPassword,
        role: validatedData.role,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    })

    // Create token and set cookie
    const token = await createToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    })
    setTokenCookie(token)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      )
    }
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
