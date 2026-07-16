import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const classFilter = searchParams.get('class')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}

  if (classFilter) {
    where.class = classFilter
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nis: { contains: search } },
    ]
  }

  // Orang tua hanya bisa lihat anaknya sendiri
  if (user.role === 'ORANG_TUA') {
    where.parentId = user.id
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      parent: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ students })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validatedData = studentSchema.parse(body)

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

    const student = await prisma.student.create({
      data: {
        name: validatedData.name,
        nis: validatedData.nis,
        class: validatedData.class,
        parentId: validatedData.parentId,
      },
      include: {
        parent: {
          select: { id: true, name: true, email: true },
        },
      },
    })

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
