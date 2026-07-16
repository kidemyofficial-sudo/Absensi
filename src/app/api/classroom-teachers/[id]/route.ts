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

  const classroomTeacher = await prisma.classroomTeacher.findUnique({
    where: { id },
    include: { student: { select: { id: true } } },
  })

  if (!classroomTeacher) {
    return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  }

  // Disconnect all students first
  await prisma.classroomTeacher.update({
    where: { id },
    data: {
      student: {
        disconnect: classroomTeacher.student.map((s) => ({ id: s.id })),
      },
    },
  })

  // Delete the classroom teacher
  await prisma.classroomTeacher.delete({ where: { id } })

  return NextResponse.json({ message: 'Berhasil dihapus' })
}
