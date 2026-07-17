import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit, getIp } from '@/lib/audit'
import { sanitize } from '@/lib/sanitize'

// Schema untuk Orang Tua mendaftarkan siswa
const parentRegisterSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  ttl: z.string().min(1, 'Tempat tanggal lahir harus diisi'),
  domisili: z.string().min(1, 'Domisili harus diisi'),
  asalSekolah: z.string().min(1, 'Asal sekolah harus diisi'),
})

// Schema untuk Owner approve dan assign
const ownerAssignSchema = z.object({
  studentId: z.string().cuid(),
  cabangDaerah: z.string().min(1, 'Cabang Daerah harus diisi'),
  branchTeacherId: z.string().cuid().optional(),
})

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const cabangFilter = searchParams.get('cabang')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}

  // Default filter: Guru hanya lihat siswa APPROVED
  if (user.role === 'GURU') {
    where.status = 'APPROVED'
  } else if (status) {
    where.status = status
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

  const students = await prisma.student.findMany({
    where,
    include: {
      parent: {
        select: { id: true, name: true, phone: true },
      },
      branchTeachers: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ students })
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
    const student = await prisma.student.create({
      data: {
        name: sanitize(validatedData.name),
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
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid' },
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
