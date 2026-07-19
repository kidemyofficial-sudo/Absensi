import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { changePasswordSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get user with password
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!userData) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Verify current password
    const isValid = await verifyPassword(validatedData.currentPassword, userData.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 })
    }

    // Update password
    const hashedPassword = await hashPassword(validatedData.newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: 'Password berhasil diubah' })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid' }, { status: 400 })
    }
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
