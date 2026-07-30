import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ownerUpdateUserSchema, updateProfileSchema } from '@/lib/validations'
import { ZodError } from 'zod'

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
    const action = typeof body?.action === 'string' ? body.action : null

    // Handle ARCHIVE / RESTORE action (khusus Owner)
    if (action === 'ARCHIVE' || action === 'RESTORE') {
      if (user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Hanya Owner yang bisa mengarsipkan user' }, { status: 403 })
      }
      if (user.id === id) {
        return NextResponse.json({ error: 'Tidak bisa mengarsipkan diri sendiri' }, { status: 400 })
      }

      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          role: true,
          students: {
            where: { archivedAt: null },
            select: { id: true, name: true },
          },
        },
      })

      if (!targetUser) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
      }

      // Wali murid yang masih punya siswa aktif tidak bisa diarsipkan
      if (action === 'ARCHIVE' && targetUser.role === 'ORANG_TUA' && targetUser.students.length > 0) {
        return NextResponse.json(
          {
            error: `Wali murid masih memiliki ${targetUser.students.length} siswa aktif. Arsipkan atau hapus siswa terlebih dahulu.`,
          },
          { status: 400 }
        )
      }

      const updated = await prisma.user.update({
        where: { id },
        data:
          action === 'ARCHIVE'
            ? { isArchived: true, archivedAt: new Date() }
            : { isArchived: false, archivedAt: null },
        select: { id: true, name: true, role: true, isArchived: true },
      })

      return NextResponse.json({
        user: updated,
        message:
          action === 'ARCHIVE'
            ? `${targetUser.name} berhasil dipindahkan ke storage`
            : `${targetUser.name} berhasil dipulihkan dari storage`,
      })
    }

    const dataToUpdate: {
      name?: string
      phone?: string
      status?: 'PENDING' | 'APPROVED' | 'REJECTED'
      password?: string
    } = {}

    if (user.role === 'OWNER') {
      const validatedData = ownerUpdateUserSchema.parse(body)

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

      if (validatedData.name !== undefined) dataToUpdate.name = validatedData.name
      if (validatedData.phone !== undefined) dataToUpdate.phone = validatedData.phone
      if (validatedData.status !== undefined) dataToUpdate.status = validatedData.status
      if (validatedData.password) {
        dataToUpdate.password = await hashPassword(validatedData.password)
      }
    } else {
      const validatedData = updateProfileSchema.parse(body)

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

      if (validatedData.name !== undefined) dataToUpdate.name = validatedData.name
      if (validatedData.phone !== undefined) dataToUpdate.phone = validatedData.phone
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid' }, { status: 400 })
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

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Hapus semua notifikasi user
      await tx.notification.deleteMany({ where: { userId: id } })

      // 2. Hapus task & jadwal guru/user
      await tx.myTask.deleteMany({ where: { userId: id } })
      await tx.teacherSchedule.deleteMany({ where: { userId: id } })

      // 3. Jika Wali Murid (ORANG_TUA)
      if (targetUser.role === 'ORANG_TUA') {
        const studentRows = await tx.student.findMany({
          where: { parentId: id },
          select: { id: true },
        })

        if (studentRows.length > 0) {
          const studentIds = studentRows.map((s) => s.id)

          // Cari semua lesson milik siswa-siswa ini
          const studentLessons = await tx.lesson.findMany({
            where: { studentId: { in: studentIds } },
            select: { id: true },
          })
          const lessonIds = studentLessons.map((l) => l.id)

          if (lessonIds.length > 0) {
            await tx.lessonRevenue.deleteMany({
              where: { lessonId: { in: lessonIds } },
            })
          }

          await tx.attendance.deleteMany({
            where: { studentId: { in: studentIds } },
          })

          await tx.lesson.deleteMany({
            where: { studentId: { in: studentIds } },
          })

          // StudentTeacher di-cascade delete saat student dihapus (onDelete: Cascade)
          // Hapus semua siswa milik Wali Murid ini
          await tx.student.deleteMany({
            where: { parentId: id },
          })
        }
      }

      // 4. Jika Guru (GURU)
      if (targetUser.role === 'GURU') {
        // Cari semua lesson milik Guru ini
        const guruLessons = await tx.lesson.findMany({
          where: { guruId: id },
          select: { id: true },
        })
        const lessonIds = guruLessons.map((l) => l.id)

        if (lessonIds.length > 0) {
          await tx.lessonRevenue.deleteMany({
            where: { lessonId: { in: lessonIds } },
          })
        }

        await tx.attendance.deleteMany({
          where: { teacherId: id },
        })

        await tx.lesson.deleteMany({
          where: { guruId: id },
        })

        // StudentTeacher di-cascade delete saat BranchTeacher dihapus (onDelete: Cascade)
        // Hapus semua BranchTeacher milik Guru ini
        await tx.branchTeacher.deleteMany({
          where: { userId: id },
        })
      }

      // 5. Hapus User secara permanen
      await tx.user.delete({
        where: { id },
      })
    })

    const roleName = targetUser.role === 'GURU' ? 'Guru' : targetUser.role === 'ORANG_TUA' ? 'Wali Murid' : 'User'
    return NextResponse.json({ message: `${roleName} berhasil dihapus permanen` })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 })
  }
}
