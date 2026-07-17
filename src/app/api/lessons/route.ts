import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lessonSchema } from '@/lib/validations'
import { apiRatelimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  // Rate limiting
  const ip = getClientIp(request)
  const { success } = await apiRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Terlalu banyak request' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
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

  if (user.role === 'GURU') {
    where.guruId = user.id
  }

  if (user.role === 'ORANG_TUA') {
    const children = await prisma.student.findMany({
      where: { parentId: user.id },
      select: { id: true },
    })
    if (children.length > 0) {
      // Gunakan studentId untuk filtering (bukan nama)
      where.studentId = { in: children.map((c) => c.id) }
    } else {
      where.studentId = '__NONE__'
    }
  }

  const [lessons, total] = await prisma.$transaction([
    prisma.lesson.findMany({
      where,
      orderBy: [{ tanggalLes: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.lesson.count({ where }),
  ])

  return NextResponse.json({
    lessons,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Hanya guru yang dapat menginput les' }, { status: 403 })
  }

  // Rate limiting
  const ip = getClientIp(request)
  const { success } = await apiRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Terlalu banyak request' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const validatedData = lessonSchema.parse(body)

    // Validate jumlahMurid
    if (isNaN(validatedData.jumlahMurid) || validatedData.jumlahMurid <= 0) {
      return NextResponse.json({ error: 'Jumlah murid tidak valid' }, { status: 400 })
    }

    // Create lesson and revenue in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          tanggalLes: new Date(validatedData.tanggalLes),
          guruId: user.id,
          studentId: validatedData.studentId || null,
          namaGuru: user.name,
          whatsappGuru: user.phone,
          jenisPembelajaran: validatedData.jenisPembelajaran,
          lokasiMengajar: validatedData.lokasiMengajar,
          kelasMurid: validatedData.kelasMurid || null,
          jumlahMurid: validatedData.jumlahMurid,
          namaMurid: validatedData.namaMurid,
          catatanMateri: validatedData.catatanMateri,
          fotoUrl: validatedData.fotoUrl || null,
          jamMulai: validatedData.jamMulai,
          jamSelesai: validatedData.jamSelesai,
          namaWaliMurid: validatedData.namaWaliMurid,
          whatsappWaliMurid: validatedData.whatsappWaliMurid || null,
        },
      })

      // Find BranchTeacher for this guru
      const branchTeacher = await tx.branchTeacher.findFirst({
        where: { userId: user.id },
      })

      const biayaPerSesi = branchTeacher?.biayaPerSesi ?? 50000
      const persentaseOwner = branchTeacher?.persentaseOwner ?? 40
      const persentaseGuru = branchTeacher?.persentaseGuru ?? 60

      const biayaTotal = validatedData.jumlahMurid * biayaPerSesi
      const pendapatanOwner = Math.floor(biayaTotal * persentaseOwner / 100)
      const pendapatanGuru = Math.floor(biayaTotal * persentaseGuru / 100)

      const lessonRevenue = await tx.lessonRevenue.create({
        data: {
          lessonId: lesson.id,
          biayaPerSesi,
          jumlahMurid: validatedData.jumlahMurid,
          biayaTotal,
          persentaseOwner,
          persentaseGuru,
          pendapatanOwner,
          pendapatanGuru,
        },
      })

      return { lesson, revenue: lessonRevenue }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      )
    }
    console.error('Create lesson error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
