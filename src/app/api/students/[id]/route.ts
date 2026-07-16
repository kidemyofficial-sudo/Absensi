import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations'

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
        select: { id: true, name: true, email: true },
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

    // Check NIS uniqueness if changed
    if (validatedData.nis && validatedData.nis !== existingStudent.nis) {
      const nisExists = await prisma.student.findUnique({
        where: { nis: validatedData.nis },
      })

      if (nisExists) {
        return NextResponse.json({ error: 'NIS sudah digunakan' }, { status: 400 })
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data: validatedData,
      include: {
        parent: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ student })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.message },
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

  const existingStudent = await prisma.student.findUnique({
    where: { id },
  })

  if (!existingStudent) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
  }

  await prisma.student.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Siswa berhasil dihapus' })
}
