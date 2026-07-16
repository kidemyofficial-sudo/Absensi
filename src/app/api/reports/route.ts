import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const classFilter = searchParams.get('class')
  const studentId = searchParams.get('studentId')

  const where: Record<string, unknown> = {}

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  } else if (startDate) {
    where.date = { gte: new Date(startDate) }
  } else if (endDate) {
    where.date = { lte: new Date(endDate) }
  }

  if (classFilter) {
    where.student = { class: classFilter }
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
        select: { id: true, name: true, nis: true, class: true },
      },
    },
    orderBy: [{ date: 'desc' }, { student: { name: 'asc' } }],
  })

  // Group by student for summary
  interface StudentSummary {
    student: { id: string; name: string; nis: string; class: string | null }
    HADIR: number
    IZIN: number
    SAKIT: number
    ALPA: number
    total: number
  }

  const studentSummary = attendances.reduce<Record<string, StudentSummary>>(
    (acc, attendance) => {
      const studentId = attendance.studentId
      if (!acc[studentId]) {
        acc[studentId] = {
          student: attendance.student,
          HADIR: 0,
          IZIN: 0,
          SAKIT: 0,
          ALPA: 0,
          total: 0,
        }
      }
      acc[studentId][attendance.status as keyof Omit<StudentSummary, 'student' | 'total'>]++
      acc[studentId].total++
      return acc
    },
    {}
  )

  return NextResponse.json({
    attendances,
    summary: Object.values(studentSummary),
  })
}
