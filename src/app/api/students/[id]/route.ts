import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations'
import { logAudit, getIp } from '@/lib/audit'
import { sanitize } from '@/lib/sanitize'
import { ZodError } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, name: true, phone: true },
      },
    },
  })

  if (!student) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
  }

  // Orang tua hanya bisa lihat anaknya sendiri
  if (user.role === 'ORANG_TUA' && student.parentId !== user.id) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  return NextResponse.json({ student })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const action = typeof body?.action === 'string' ? body.action : null

    if (action !== 'ARCHIVE' && action !== 'RESTORE') {
      return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      select: { id: true, name: true },
    })
    if (!existingStudent) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    }

    const updated = await prisma.student.update({
      where: { id },
      data:
        action === 'ARCHIVE'
          ? { isArchived: true, archivedAt: new Date() }
          : { isArchived: false, archivedAt: null },
    })

    await logAudit({
      userId: user.id,
      action: action === 'ARCHIVE' ? 'ARCHIVE' : 'RESTORE',
      entity: 'Student',
      entityId: id,
      oldData: {
        name: existingStudent.name,
        action,
      },
      newData: {
        action,
        isArchived: updated.isArchived,
        archivedAt: updated.archivedAt,
      },
      ip: getIp(request),
    })

    return NextResponse.json({ student: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Update storage student error:', error)

    if (message.includes('isArchived') || message.includes('archivedAt')) {
      return NextResponse.json(
        {
          error:
            'Fitur Storage siswa belum bisa dipakai karena schema database belum siap. Jalankan `npx prisma db push` tanpa `--force-reset`, lalu coba lagi.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const validatedData = studentSchema.partial().parse(body)

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    }

    // Sanitize string fields
    const sanitizedData: Record<string, unknown> = { ...validatedData }
    if (sanitizedData.name) sanitizedData.name = sanitize(sanitizedData.name as string)
    if (sanitizedData.ttl) sanitizedData.ttl = sanitize(sanitizedData.ttl as string)
    if (sanitizedData.domisili) sanitizedData.domisili = sanitize(sanitizedData.domisili as string)
    if (sanitizedData.asalSekolah) sanitizedData.asalSekolah = sanitize(sanitizedData.asalSekolah as string)

    const student = await prisma.student.update({
      where: { id },
      data: sanitizedData,
      include: {
        parent: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'Student',
      entityId: id,
      oldData: { name: existingStudent.name, cabangDaerah: existingStudent.cabangDaerah },
      newData: validatedData as Record<string, unknown>,
      ip: getIp(request),
    })

    return NextResponse.json({ student })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }
    console.error('Update student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const { id } = await params

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'soft' // soft | hard

  try {
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        cabangDaerah: true,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    }

    if (mode === 'soft') {
      const updated = await prisma.student.update({
        where: { id },
        data: { isArchived: true, archivedAt: new Date() },
      })

      await logAudit({
        userId: user.id,
        action: 'ARCHIVE',
        entity: 'Student',
        entityId: id,
        oldData: { name: existingStudent.name },
        newData: { isArchived: updated.isArchived, archivedAt: updated.archivedAt },
        ip: getIp(request),
      })

      return NextResponse.json({ message: 'Siswa dipindahkan ke storage' })
    }

    if (mode === 'hard') {
      const [attendanceCount, lessonCount, lessonIds] = await Promise.all([
        prisma.attendance.count({ where: { studentId: id } }),
        prisma.lesson.count({ where: { studentId: id } }),
        prisma.lesson.findMany({
          where: { studentId: id },
          select: { id: true },
        }),
      ])

      const lessonIdList = lessonIds.map((lesson) => lesson.id)

      await prisma.$transaction(async (tx) => {
        if (lessonIdList.length > 0) {
          await tx.lessonRevenue.deleteMany({
            where: {
              lessonId: { in: lessonIdList },
            },
          })
        }

        await tx.attendance.deleteMany({ where: { studentId: id } })
        await tx.lesson.deleteMany({ where: { studentId: id } })

        await tx.student.update({
          where: { id },
          data: { branchTeachers: { set: [] } },
        })

        await tx.student.delete({ where: { id } })
      })

      await logAudit({
        userId: user.id,
        action: 'DELETE',
        entity: 'Student',
        entityId: id,
        oldData: {
          name: existingStudent.name,
          cabangDaerah: existingStudent.cabangDaerah,
          deletedAttendances: attendanceCount,
          deletedLessons: lessonCount,
        },
        ip: getIp(request),
      })

      return NextResponse.json({
        message:
          attendanceCount > 0 || lessonCount > 0
            ? `Siswa berhasil dihapus permanen beserta ${attendanceCount} absensi dan ${lessonCount} riwayat les terkait`
            : 'Siswa berhasil dihapus permanen',
      })
    }

    return NextResponse.json({ error: 'Mode hapus tidak valid' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Delete student error:', error)

    if (mode === 'soft' && (message.includes('isArchived') || message.includes('archivedAt'))) {
      return NextResponse.json(
        {
          error:
            'Hapus sementara belum bisa dipakai karena schema database untuk Storage siswa belum siap. Jalankan `npx prisma db push` tanpa `--force-reset`, lalu coba lagi.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: 'Gagal menghapus siswa' }, { status: 500 })
  }
}
