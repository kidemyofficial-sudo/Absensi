import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Tidak terautentikasi atau bukan Guru' }, { status: 401 })
  }

  const { id } = await params

  try {
    const schedule = await prisma.teacherSchedule.findUnique({ where: { id } })

    if (!schedule) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
    }

    if (schedule.userId !== user.id) {
      return NextResponse.json({ error: 'Bukan pemilik jadwal ini' }, { status: 403 })
    }

    await prisma.teacherSchedule.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    return NextResponse.json({ error: 'Gagal menghapus jadwal' }, { status: 500 })
  }
}
