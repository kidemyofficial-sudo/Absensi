import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const branchTeachers = await prisma.branchTeacher.findMany({
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
      student: {
        select: { id: true, name: true },
      },
    },
    orderBy: { cabangDaerah: 'asc' },
  })

  return NextResponse.json({ branchTeachers })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa menambah guru cabang daerah' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { teacherId, cabangDaerah, provinsi, kotaKabupaten, mataPelajaran } = body

    if (!teacherId || !cabangDaerah || !provinsi || !kotaKabupaten || !mataPelajaran) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Check if teacher exists and is a GURU
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
    })

    if (!teacher || teacher.role !== 'GURU') {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })
    }

    // Check if already assigned to this branch
    const existing = await prisma.branchTeacher.findUnique({
      where: {
        userId_cabangDaerah: {
          userId: teacherId,
          cabangDaerah,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Guru sudah mengampu cabang daerah ini' }, { status: 400 })
    }

    const branchTeacher = await prisma.branchTeacher.create({
      data: {
        userId: teacherId,
        cabangDaerah,
        provinsi,
        kotaKabupaten,
        mataPelajaran,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ branchTeacher }, { status: 201 })
  } catch (error) {
    console.error('Create branch teacher error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
