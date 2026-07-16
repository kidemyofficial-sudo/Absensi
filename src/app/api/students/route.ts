import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema untuk Orang Tua mendaftarkan siswa
const parentRegisterSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  nis: z.string().min(1, 'NIS harus diisi'),
})

// Schema untuk Owner approve dan assign
const ownerAssignSchema = z.object({
  studentId: z.string().cuid(),
  class: z.string().min(1, 'Kelas harus diisi'),
  classroomTeacherId: z.string().cuid().optional(),
})

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const classFilter = searchParams.get('class')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}

  // Default filter: Guru hanya lihat siswa APPROVED
  if (user.role === 'GURU') {
    where.status = 'APPROVED'
  } else if (status) {
    where.status = status
  }

  if (classFilter) {
    where.class = classFilter
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nis: { contains: search } },
    ]
  }

  // Orang Tua hanya bisa lihat anaknya sendiri
  if (user.role === 'ORANG_TUA') {
    where.parentId = user.id
  }

  // Guru hanya bisa lihat siswa di kelasnya
  if (user.role === 'GURU') {
    where.classroomTeachers = {
      some: { userId: user.id },
    }
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      parent: {
        select: { id: true, name: true, email: true },
      },
      classroomTeachers: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ students })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  // Hanya Orang Tua yang bisa mendaftarkan siswa
  if (user.role !== 'ORANG_TUA') {
    return NextResponse.json(
      { error: 'Hanya Orang Tua yang bisa mendaftarkan siswa' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = parentRegisterSchema.parse(body)

    // Check if NIS already exists
    const existingStudent = await prisma.student.findUnique({
      where: { nis: validatedData.nis },
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'NIS sudah terdaftar' },
        { status: 400 }
      )
    }

    // Create student with PENDING status
    const student = await prisma.student.create({
      data: {
        name: validatedData.name,
        nis: validatedData.nis,
        parentId: user.id,
        status: 'PENDING',
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    })

    // Notify owner
    const owners = await prisma.user.findMany({
      where: { role: 'OWNER' },
      select: { id: true },
    })

    await Promise.all(
      owners.map((owner) =>
        prisma.notification.create({
          data: {
            userId: owner.id,
            message: `Pendaftaran siswa baru: ${student.name} (NIS: ${student.nis}) menunggu persetujuan`,
          },
        })
      )
    )

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.message },
        { status: 400 }
      )
    }
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
