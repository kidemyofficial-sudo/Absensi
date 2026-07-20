import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Tidak terautentikasi atau bukan Guru' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') // YYYY-MM-DD (optional filter)

  try {
    const schedules = await prisma.teacherSchedule.findMany({
      where: {
        userId: user.id,
        ...(dateStr && { date: new Date(dateStr) }),
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    return NextResponse.json({ error: 'Gagal mengambil data jadwal' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Tidak terautentikasi atau bukan Guru' }, { status: 401 })
  }

  try {
    const { title, description, date, time } = await request.json()

    if (!title || !date || !time) {
      return NextResponse.json({ error: 'Judul, tanggal, dan waktu wajib diisi' }, { status: 400 })
    }

    const newSchedule = await prisma.teacherSchedule.create({
      data: {
        userId: user.id,
        title,
        description,
        date: new Date(date),
        time, // e.g. "08:15 AM"
        notified: false,
      },
    })

    return NextResponse.json({ schedule: newSchedule })
  } catch (error) {
    console.error('Failed to create schedule:', error)
    return NextResponse.json({ error: 'Gagal membuat jadwal baru' }, { status: 500 })
  }
}
