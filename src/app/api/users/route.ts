import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(['GURU', 'ORANG_TUA', 'OWNER']),
})

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const search = searchParams.get('search')?.trim()
  const archived = searchParams.get('archived')

  const where: Record<string, unknown> = {}
  if (role) {
    where.role = role
  }

  // Filter storage: Owner bisa lihat user yang di-arsip dengan ?archived=1
  // Default: tampilkan user yang tidak diarsip (isArchived = false atau null untuk data lama)
  if (archived === '1') {
    where.isArchived = true
  } else {
    where.isArchived = { not: true }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        students: {
          select: {
            id: true,
            name: true,
          },
        },
        branchTeachers: {
          select: {
            cabangDaerah: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Users GET error:', err)

    // Fallback aman: bila kolom isArchived belum ada di database
    if (msg.includes('isArchived') || msg.includes('archivedAt')) {
      const fallbackWhere: Record<string, unknown> = {}
      if (role) fallbackWhere.role = role
      if (search) {
        fallbackWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      }
      const users = await prisma.user.findMany({
        where: fallbackWhere,
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          students: { select: { id: true, name: true } },
          branchTeachers: { select: { cabangDaerah: true } },
        },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json({ users, warning: 'Kolom storage belum tersedia, menampilkan semua data.' })
    }

    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa menambah user' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if phone exists
    const existing = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
    })

    if (existing) {
      return NextResponse.json({ error: 'Nomor telepon sudah terdaftar' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(validatedData.password)
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        password: hashedPassword,
        role: validatedData.role,
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
      },
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
