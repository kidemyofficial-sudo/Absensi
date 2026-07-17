import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  let setting = await prisma.revenueSetting.findFirst()

  if (!setting) {
    setting = await prisma.revenueSetting.create({
      data: {
        biayaPerSiswaPerSesi: 50000,
        persentaseOwner: 40,
        persentaseGuru: 60,
      },
    })
  }

  return NextResponse.json({ setting })
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya owner yang dapat mengatur pengaturan ini' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { biayaPerSiswaPerSesi, persentaseOwner, persentaseGuru } = body

    if (biayaPerSiswaPerSesi === undefined || persentaseOwner === undefined || persentaseGuru === undefined) {
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

    let setting = await prisma.revenueSetting.findFirst()

    if (setting) {
      setting = await prisma.revenueSetting.update({
        where: { id: setting.id },
        data: {
          biayaPerSiswaPerSesi: Number(biayaPerSiswaPerSesi),
          persentaseOwner: Number(persentaseOwner),
          persentaseGuru: Number(persentaseGuru),
        },
      })
    } else {
      setting = await prisma.revenueSetting.create({
        data: {
          biayaPerSiswaPerSesi: Number(biayaPerSiswaPerSesi),
          persentaseOwner: Number(persentaseOwner),
          persentaseGuru: Number(persentaseGuru),
        },
      })
    }

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Update revenue settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
