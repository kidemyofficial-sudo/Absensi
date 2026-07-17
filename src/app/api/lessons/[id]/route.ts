import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
  })

  if (!lesson) {
    return NextResponse.json({ error: 'Les tidak ditemukan' }, { status: 404 })
  }

  // Guru hanya bisa lihat les sendiri
  if (user.role === 'GURU' && lesson.guruId !== user.id) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  return NextResponse.json({ lesson })
}
