import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya owner yang dapat mengakses' }, { status: 403 })
  }

  const branchTeachers = await prisma.branchTeacher.findMany({
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { user: { name: 'asc' } },
  })

  return NextResponse.json({ branchTeachers })
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya owner yang dapat mengatur pengaturan ini' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { branchTeacherId, biayaPerSesi, persentaseOwner, persentaseGuru } = body

    if (!branchTeacherId || biayaPerSesi === undefined || persentaseOwner === undefined || persentaseGuru === undefined) {
      return NextResponse.json(
        { error: 'Semua field wajib harus diisi' },
        { status: 400 }
      )
    }

    if (persentaseOwner + persentaseGuru !== 100) {
      return NextResponse.json(
        { error: 'Persentase harus totaling 100%' },
        { status: 400 }
      )
    }

    const updated = await prisma.branchTeacher.update({
      where: { id: branchTeacherId },
      data: {
        biayaPerSesi: Number(biayaPerSesi),
        persentaseOwner: Number(persentaseOwner),
        persentaseGuru: Number(persentaseGuru),
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    return NextResponse.json({ branchTeacher: updated })
  } catch (error) {
    console.error('Update revenue settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
