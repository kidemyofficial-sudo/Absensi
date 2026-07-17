import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa menghapus' }, { status: 403 })
  }

  const { id } = await params

  const branchTeacher = await prisma.branchTeacher.findUnique({
    where: { id },
    include: { student: { select: { id: true } } },
  })

  if (!branchTeacher) {
    return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  }

  // Disconnect all students first
  await prisma.branchTeacher.update({
    where: { id },
    data: {
      student: {
        disconnect: branchTeacher.student.map((s) => ({ id: s.id })),
      },
    },
  })

  // Delete the branch teacher
  await prisma.branchTeacher.delete({ where: { id } })

  return NextResponse.json({ message: 'Berhasil dihapus' })
}
