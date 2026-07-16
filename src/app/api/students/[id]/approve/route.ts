import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa menyetujui' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { status } = body // APPROVED atau REJECTED

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: { parent: { select: { id: true, name: true } } },
  })

  if (!student) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
  }

  const updated = await prisma.student.update({
    where: { id },
    data: { status },
  })

  // Notify parent
  await prisma.notification.create({
    data: {
      userId: student.parentId,
      message: `Pendaftaran siswa ${student.name} telah ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
    },
  })

  return NextResponse.json({ student: updated })
}
