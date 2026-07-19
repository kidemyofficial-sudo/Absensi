import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (user.role === 'OWNER') {
    let totalStudents = 0
    let totalTeachers = 0
    let todayAttendance = 0

    try {
      totalStudents = await prisma.student.count()
    } catch {
      totalStudents = 0
    }

    try {
      totalTeachers = await prisma.user.count({ where: { role: 'GURU' } })
    } catch {
      totalTeachers = 0
    }

    try {
      todayAttendance = await prisma.attendance.count({ where: { date: today } })
    } catch {
      todayAttendance = 0
    }

    return NextResponse.json({
      role: 'OWNER',
      stats: {
        totalStudents,
        totalTeachers,
        todayAttendance,
      },
    })
  }

  if (user.role === 'GURU') {
    const branchTeachers = await prisma.branchTeacher.findMany({
      where: { userId: user.id },
      select: {
        cabangDaerah: true,
        _count: {
          select: {
            student: true,
          },
        },
      },
    })

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        teacherId: user.id,
        date: today,
      },
      include: {
        student: {
          select: { name: true, cabangDaerah: true },
        },
      },
    })

    return NextResponse.json({
      role: 'GURU',
      classes: branchTeachers.map((bt) => ({
        name: bt.cabangDaerah,
        studentCount: bt._count.student,
      })),
      todayAttendances: todayAttendances.length,
    })
  }

  if (user.role === 'ORANG_TUA') {
    const children = await prisma.student.findMany({
      where: { parentId: user.id },
      select: {
        id: true,
        name: true,
        ttl: true,
        domisili: true,
        asalSekolah: true,
        cabangDaerah: true,
      },
    })

    const childrenIds = children.map((c) => c.id)

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: childrenIds },
        date: today,
      },
      select: {
        studentId: true,
        status: true,
        note: true,
      },
    })

    const childrenWithAttendance = children.map((child) => ({
      ...child,
      attendance: todayAttendances.find((a) => a.studentId === child.id) || null,
    }))

    return NextResponse.json({
      role: 'ORANG_TUA',
      children: childrenWithAttendance,
    })
  }

  return NextResponse.json({ error: 'Role tidak dikenal' }, { status: 400 })
}
