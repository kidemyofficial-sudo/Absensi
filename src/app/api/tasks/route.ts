import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Tidak terautentikasi atau bukan Guru' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') // YYYY-MM-DD

  if (!dateStr) {
    return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 })
  }

  try {
    const tasks = await prisma.myTask.findMany({
      where: {
        userId: user.id,
        date: new Date(dateStr),
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Gagal mengambil data tugas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Tidak terautentikasi atau bukan Guru' }, { status: 401 })
  }

  try {
    const { title, date } = await request.json()

    if (!title || !date) {
      return NextResponse.json({ error: 'Judul dan tanggal wajib diisi' }, { status: 400 })
    }

    const newTask = await prisma.myTask.create({
      data: {
        userId: user.id,
        title,
        date: new Date(date),
      },
    })

    return NextResponse.json({ task: newTask })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Gagal membuat tugas' }, { status: 500 })
  }
}
