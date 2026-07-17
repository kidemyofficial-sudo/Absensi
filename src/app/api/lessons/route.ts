import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const guruFilter = searchParams.get('guru')
  const jenisFilter = searchParams.get('jenis')

  const where: Record<string, unknown> = {}

  if (startDate && endDate) {
    where.tanggalLes = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  } else if (startDate) {
    where.tanggalLes = { gte: new Date(startDate) }
  } else if (endDate) {
    where.tanggalLes = { lte: new Date(endDate) }
  }

  if (guruFilter) {
    where.namaGuru = guruFilter
  }

  if (jenisFilter) {
    where.jenisPembelajaran = jenisFilter
  }

  // Guru hanya bisa lihat les yang dia input
  if (user.role === 'GURU') {
    where.guruId = user.id
  }

  // ORANG_TUA: find lessons matching their children's names
  if (user.role === 'ORANG_TUA') {
    const children = await prisma.student.findMany({
      where: { parentId: user.id },
      select: { name: true },
    })
    if (children.length > 0) {
      where.namaMurid = { in: children.map((c) => c.name) }
    } else {
      where.namaMurid = '__NONE__'
    }
  }

  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: [{ tanggalLes: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ lessons })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Hanya guru yang dapat menginput les' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const {
      tanggalLes,
      jenisPembelajaran,
      lokasiMengajar,
      kelasMurid,
      jumlahMurid,
      namaMurid,
      catatanMateri,
      fotoUrl,
      jamMulai,
      jamSelesai,
      namaWaliMurid,
      whatsappWaliMurid,
    } = body

    if (!tanggalLes || !jenisPembelajaran || !lokasiMengajar || !jumlahMurid || !namaMurid || !catatanMateri || !jamMulai || !jamSelesai || !namaWaliMurid) {
      return NextResponse.json(
        { error: 'Semua field wajib harus diisi' },
        { status: 400 }
      )
    }

    const lesson = await prisma.lesson.create({
      data: {
        tanggalLes: new Date(tanggalLes),
        guruId: user.id,
        namaGuru: user.name,
        whatsappGuru: user.phone,
        jenisPembelajaran,
        lokasiMengajar,
        kelasMurid: kelasMurid || null,
        jumlahMurid: Number(jumlahMurid),
        namaMurid,
        catatanMateri,
        fotoUrl: fotoUrl || null,
        jamMulai,
        jamSelesai,
        namaWaliMurid,
        whatsappWaliMurid: whatsappWaliMurid || null,
      },
    })

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    console.error('Create lesson error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
