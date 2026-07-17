import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bulkAttendanceSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const cabangFilter = searchParams.get('cabang')
  const studentId = searchParams.get('studentId')

  const where: Record<string, unknown> = {}

  if (date) {
    where.date = new Date(date)
  }

  if (cabangFilter) {
    where.student = { cabangDaerah: cabangFilter }
  }

  if (studentId) {
    where.studentId = studentId
  }

  // Guru hanya bisa lihat absensi yang dia input
  if (user.role === 'GURU') {
    where.teacherId = user.id
  }

  // Orang tua hanya bisa lihat absensi anaknya
  if (user.role === 'ORANG_TUA') {
    const children = await prisma.student.findMany({
      where: { parentId: user.id },
      select: { id: true },
    })
    where.studentId = { in: children.map((c) => c.id) }
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      student: {
        select: { id: true, name: true, ttl: true, cabangDaerah: true },
      },
      teacher: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ date: 'desc' }, { student: { name: 'asc' } }],
  })

  return NextResponse.json({ attendances })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Hanya guru yang dapat menginput absensi' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validatedData = bulkAttendanceSchema.parse(body)

    const date = new Date(validatedData.date)
    date.setHours(0, 0, 0, 0)

    // Verify teacher has access to these students (only APPROVED)
    const studentIds = validatedData.attendances.map((a) => a.studentId)
    const validStudents = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        status: 'APPROVED',
        branchTeachers: {
          some: { userId: user.id },
        },
      },
      select: { id: true },
    })

    const validStudentIds = new Set(validStudents.map((s) => s.id))
    const invalidStudents = studentIds.filter((id) => !validStudentIds.has(id))

    if (invalidStudents.length > 0) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke beberapa siswa', invalidStudents },
        { status: 403 }
      )
    }

    // Upsert attendance records
    const results = await Promise.all(
      validatedData.attendances.map((attendance) =>
        prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: attendance.studentId,
              date: date,
            },
          },
          update: {
            status: attendance.status,
            note: attendance.note,
            teacherId: user.id,
          },
          create: {
            studentId: attendance.studentId,
            teacherId: user.id,
            date: date,
            status: attendance.status,
            note: attendance.note,
          },
        })
      )
    )

    // Create notifications for parents
    const attendanceWithStudents = await prisma.attendance.findMany({
      where: {
        id: { in: results.map((r) => r.id) },
      },
      include: {
        student: {
          select: { name: true, parentId: true },
        },
      },
    })

    await Promise.all(
      attendanceWithStudents
        .filter((a) => a.student.parentId)
        .map((a) =>
          prisma.notification.create({
            data: {
              userId: a.student.parentId!,
              message: `Absensi ${a.student.name}: ${a.status}${
                a.note ? ` (${a.note})` : ''
              }`,
            },
          })
        )
    )

    return NextResponse.json({ attendances: results })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.message },
        { status: 400 }
      )
    }
    console.error('Create attendance error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
