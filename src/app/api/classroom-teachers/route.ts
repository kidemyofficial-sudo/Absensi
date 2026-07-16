import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const classroomTeachers = await prisma.classroomTeacher.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      student: {
        select: { id: true, name: true },
      },
    },
    orderBy: { className: 'asc' },
  })

  return NextResponse.json({ classroomTeachers })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa menambah guru kelas' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { teacherId, className } = body

    if (!teacherId || !className) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Check if teacher exists and is a GURU
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
    })

    if (!teacher || teacher.role !== 'GURU') {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })
    }

    // Check if already assigned to this class
    const existing = await prisma.classroomTeacher.findUnique({
      where: {
        userId_className: {
          userId: teacherId,
          className,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Guru sudah mengampu kelas ini' }, { status: 400 })
    }

    const classroomTeacher = await prisma.classroomTeacher.create({
      data: {
        userId: teacherId,
        className,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ classroomTeacher }, { status: 201 })
  } catch (error) {
    console.error('Create classroom teacher error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
