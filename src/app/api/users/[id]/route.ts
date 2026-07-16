import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { id } = await params

  // User bisa update profil sendiri, Owner bisa update semua
  if (user.id !== id && user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check phone uniqueness if changed
    if (validatedData.phone) {
      const existing = await prisma.user.findFirst({
        where: {
          phone: validatedData.phone,
          NOT: { id },
        },
      })

      if (existing) {
        return NextResponse.json({ error: 'Nomor telepon sudah digunakan' }, { status: 400 })
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa menghapus user' }, { status: 403 })
  }

  const { id } = await params

  // Tidak bisa hapus diri sendiri
  if (user.id === id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus diri sendiri' }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    include: {
      students: { select: { id: true } },
      attendances: { select: { id: true } },
    },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  // Cek apakah guru punya data terkait
  if (targetUser.role === 'GURU') {
    if (targetUser.attendances.length > 0) {
      return NextResponse.json(
        { error: 'Guru memiliki data absensi, tidak bisa dihapus' },
        { status: 400 }
      )
    }
  }

  // Cek apakah orang tua punya anak
  if (targetUser.role === 'ORANG_TUA') {
    if (targetUser.students.length > 0) {
      return NextResponse.json(
        { error: 'Orang Tua memiliki data siswa, tidak bisa dihapus' },
        { status: 400 }
      )
    }
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ message: 'User berhasil dihapus' })
}
