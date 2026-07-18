import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya owner yang dapat mengakses' }, { status: 403 })
  }

  // Ambil semua siswa yang sudah punya cabang + persentase dari branch teacher
  const students = await prisma.student.findMany({
    where: { status: 'APPROVED' },
    include: {
      parent: {
        select: { id: true, name: true },
      },
      branchTeachers: {
        select: {
          persentaseOwner: true,
          persentaseGuru: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ students })
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya owner yang dapat mengatur pengaturan ini' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { studentId, biayaPerSiswa } = body

    if (!studentId || biayaPerSiswa === undefined) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    if (biayaPerSiswa < 0) {
      return NextResponse.json(
        { error: 'Biaya tidak boleh negatif' },
        { status: 400 }
      )
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { biayaPerSiswa: Number(biayaPerSiswa) },
      include: {
        parent: { select: { id: true, name: true } },
        branchTeachers: {
          select: { persentaseOwner: true, persentaseGuru: true, user: { select: { name: true } } },
        },
      },
    })

    return NextResponse.json({ student: updated })
  } catch (error) {
    console.error('Update revenue settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
