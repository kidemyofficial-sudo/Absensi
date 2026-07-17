import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations'
import { logAudit, getIp } from '@/lib/audit'
import { sanitize } from '@/lib/sanitize'

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
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid' },
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

  // Audit log sebelum delete
  await logAudit({
    userId: user.id,
    action: 'DELETE',
    entity: 'Student',
    entityId: id,
    oldData: { name: existingStudent.name, cabangDaerah: existingStudent.cabangDaerah },
    ip: getIp(request),
  })

  await prisma.student.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Siswa berhasil dihapus' })
}
