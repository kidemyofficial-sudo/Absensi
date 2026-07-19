import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, StudentStatus } from '@prisma/client'
import { z } from 'zod'
import { ZodError } from 'zod'
import { logAudit, getIp } from '@/lib/audit'
import { sanitize } from '@/lib/sanitize'
import { withUniqueKodeSiswa } from '@/lib/student-code'

// Schema untuk Orang Tua mendaftarkan siswa
const parentRegisterSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  ttl: z.string().min(1, 'Tempat tanggal lahir harus diisi'),
  domisili: z.string().min(1, 'Domisili harus diisi'),
  asalSekolah: z.string().min(1, 'Asal sekolah harus diisi'),
})

const PAGE_SIZE = 25
const MAX_PAGE_SIZE = 50
const studentStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const

function getPositiveInt(value: string | null, fallback: number, max?: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return max ? Math.min(parsed, max) : parsed
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const cabangFilter = searchParams.get('cabang')
  const search = searchParams.get('search')?.trim()
  const page = getPositiveInt(searchParams.get('page'), 1)
  const limit = getPositiveInt(searchParams.get('limit'), PAGE_SIZE, MAX_PAGE_SIZE)

  const where: Prisma.StudentWhereInput = {}

  // Default filter: Guru hanya lihat siswa APPROVED
  if (user.role === 'GURU') {
    where.status = 'APPROVED'
  } else if (status && studentStatuses.includes(status as typeof studentStatuses[number])) {
    where.status = status as StudentStatus
  }

  if (cabangFilter) {
    where.cabangDaerah = cabangFilter
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { ttl: { contains: search, mode: 'insensitive' } },
      { asalSekolah: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Orang Tua hanya bisa lihat anaknya sendiri
  if (user.role === 'ORANG_TUA') {
    where.parentId = user.id
  }

  // Guru hanya bisa lihat siswa di cabangnya
  if (user.role === 'GURU') {
    where.branchTeachers = {
      some: { userId: user.id },
    }
  }

  const cabangWhere: Prisma.StudentWhereInput = { ...where }
  delete cabangWhere.cabangDaerah

  let students: any[] = []
  let total = 0
  let cabangRows: any[] = []

  try {
    students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        name: true,
        ttl: true,
        domisili: true,
        asalSekolah: true,
        cabangDaerah: true,
        status: true,
        parent: {
          select: { id: true, name: true, phone: true },
        },
        branchTeachers: {
          select: {
            id: true,
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
  } catch (err) {
    console.error("Prisma error in students findMany:", err)
  }

  try {
    total = await prisma.student.count({ where })
  } catch (err) {
    console.error("Prisma error in students count:", err)
  }

  try {
    cabangRows = await prisma.student.findMany({
      where: {
        ...cabangWhere,
        cabangDaerah: { not: null },
      },
      select: { cabangDaerah: true },
      distinct: ['cabangDaerah'],
      orderBy: { cabangDaerah: 'asc' },
    })
  } catch (err) {
    console.error("Prisma error in cabangs findMany:", err)
  }


  return NextResponse.json({
    students,
    cabangs: cabangRows.map((row) => row.cabangDaerah).filter(Boolean),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  // Hanya Orang Tua yang bisa mendaftarkan siswa
  if (user.role !== 'ORANG_TUA') {
    return NextResponse.json(
      { error: 'Hanya Orang Tua yang bisa mendaftarkan siswa' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = parentRegisterSchema.parse(body)

    // Create student with PENDING status
    const student = await withUniqueKodeSiswa((kodeSiswa) =>
      prisma.student.create({
        data: {
          name: sanitize(validatedData.name),
          kodeSiswa,
          ttl: sanitize(validatedData.ttl),
          domisili: sanitize(validatedData.domisili),
          asalSekolah: sanitize(validatedData.asalSekolah),
          parentId: user.id,
          status: 'PENDING',
        },
        include: {
          parent: {
            select: { id: true, name: true },
          },
        },
      })
    )

    // Notify owner
    const owners = await prisma.user.findMany({
      where: { role: 'OWNER' },
      select: { id: true },
    })

    await Promise.all(
      owners.map((owner) =>
        prisma.notification.create({
          data: {
            userId: owner.id,
            message: `Pendaftaran siswa baru: ${student.name} menunggu persetujuan`,
          },
        })
      )
    )

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entity: 'Student',
      entityId: student.id,
      newData: { name: student.name, status: 'PENDING' },
      ip: getIp(request),
    })

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
