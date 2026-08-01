import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit, getIp } from '@/lib/audit'

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  if (user.role !== 'OWNER' && user.role !== 'GURU') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { id } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      revenue: true,
    },
  })

  if (!lesson) {
    return NextResponse.json({ error: 'Data les tidak ditemukan' }, { status: 404 })
  }

  if (user.role === 'GURU' && lesson.guruId !== user.id) {
    return NextResponse.json({ error: 'Anda hanya bisa menghapus data les milik sendiri' }, { status: 403 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (lesson.revenue) {
        await tx.lessonRevenue.delete({
          where: { lessonId: lesson.id },
        })
      }

      await tx.lesson.delete({
        where: { id: lesson.id },
      })
    })

    await logAudit({
      userId: user.id,
      action: 'DELETE',
      entity: 'Lesson',
      entityId: lesson.id,
      oldData: {
        namaGuru: lesson.namaGuru,
        namaMurid: lesson.namaMurid,
        tanggalLes: lesson.tanggalLes,
        jamMulai: lesson.jamMulai,
        jamSelesai: lesson.jamSelesai,
        jumlahMurid: lesson.jumlahMurid,
      },
      ip: getIp(request),
    })

    return NextResponse.json({
      message: 'Data les berhasil dihapus dan tidak akan muncul lagi di laporan owner',
    })
  } catch (error) {
    console.error('Delete lesson error:', error)
    return NextResponse.json({ error: 'Gagal menghapus data les' }, { status: 500 })
  }
}
