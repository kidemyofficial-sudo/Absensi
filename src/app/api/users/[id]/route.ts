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
      branchTeachers: {
        select: {
          id: true,
          student: { select: { id: true } },
        },
      },
      lessons: { select: { id: true } },
    },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  // Orang tua yang masih punya siswa tidak bisa dihapus
  if (targetUser.role === 'ORANG_TUA' && targetUser.students.length > 0) {
    return NextResponse.json(
      { error: `Orang Tua masih memiliki ${targetUser.students.length} siswa. Hapus siswa terlebih dahulu.` },
      { status: 400 }
    )
  }

  try {
    if (targetUser.role === 'GURU') {
      // 1. Hapus LessonRevenue & Lesson terkait guru ini
      if (targetUser.lessons.length > 0) {
        const lessonIds = targetUser.lessons.map((l) => l.id)
        await prisma.lessonRevenue.deleteMany({ where: { lessonId: { in: lessonIds } } })
        await prisma.lesson.deleteMany({ where: { id: { in: lessonIds } } })
      }

      // 2. Lepaskan semua siswa dari BranchTeacher milik guru ini, lalu hapus BranchTeacher
      for (const bt of targetUser.branchTeachers) {
        if (bt.student.length > 0) {
          const studentIds = bt.student.map((s) => s.id)
          await prisma.branchTeacher.update({
            where: { id: bt.id },
            data: { student: { disconnect: studentIds.map((sid) => ({ id: sid })) } },
          })
        }
      }
      await prisma.branchTeacher.deleteMany({ where: { userId: id } })

      // 3. Hapus data attendance guru
      await prisma.attendance.deleteMany({ where: { teacherId: id } })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 })
  }
}
