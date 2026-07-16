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
    const [totalStudents, totalTeachers, todayAttendance] = await Promise.all([
      prisma.student.count(),
      prisma.user.count({ where: { role: 'GURU' } }),
      prisma.attendance.count({
        where: { date: today },
      }),
    ])

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
    const classes = await prisma.classroomTeacher.findMany({
      where: { userId: user.id },
      select: {
        className: true,
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
          select: { name: true, class: true },
        },
      },
    })

    return NextResponse.json({
      role: 'GURU',
      classes: classes.map((c) => ({
        name: c.className,
        studentCount: c._count.student,
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
        class: true,
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
