import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseScheduleTimeToDateTime(date: Date, timeStr: string): Date {
  const targetDate = new Date(date)
  let hours = 0
  let minutes = 0

  // Mendukung format AM/PM (misal: "09:30 AM")
  const matchAmPm = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (matchAmPm) {
    hours = parseInt(matchAmPm[1], 10)
    minutes = parseInt(matchAmPm[2], 10)
    const ampm = matchAmPm[3].toUpperCase()
    if (ampm === 'PM' && hours < 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
  } else {
    // Mendukung format 24 jam biasa (misal: "09:30")
    const match24 = timeStr.match(/^(\d+):(\d+)$/)
    if (match24) {
      hours = parseInt(match24[1], 10)
      minutes = parseInt(match24[2], 10)
    }
  }

  targetDate.setHours(hours, minutes, 0, 0)
  return targetDate
}

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  // Jika user adalah GURU, jalankan pengecekan pengingat jadwal
  if (user.role === 'GURU') {
    try {
      const now = new Date()
      // Ambil jadwal hari ini/besok yang belum dinotifikasi
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      
      const tomorrowEnd = new Date(now)
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
      tomorrowEnd.setHours(23, 59, 59, 999)

      const activeSchedules = await prisma.teacherSchedule.findMany({
        where: {
          userId: user.id,
          notified: false,
          date: {
            gte: todayStart,
            lte: tomorrowEnd,
          },
        },
      })

      for (const schedule of activeSchedules) {
        const scheduleDateTime = parseScheduleTimeToDateTime(schedule.date, schedule.time)
        const diffMs = scheduleDateTime.getTime() - now.getTime()
        const diffMins = diffMs / 60000

        // Jika acara dimulai dalam rentang 15 menit ke depan (dan belum terlewat lebih dari 1 menit)
        if (diffMins > 0 && diffMins <= 15) {
          // Buat Notifikasi
          await prisma.notification.create({
            data: {
              userId: user.id,
              message: `Pengingat: Jadwal '${schedule.title}' akan dimulai 15 menit lagi pada pukul ${schedule.time}.`,
              isRead: false,
            },
          })

          // Tandai jadwal sudah dinotifikasi
          await prisma.teacherSchedule.update({
            where: { id: schedule.id },
            data: { notified: true },
          })
        } else if (diffMins < -10) {
          // Jika jadwal sudah lewat jauh (misal > 10 menit lewat) tapi belum sempat dinotifikasi (misal karena user baru login setelahnya), 
          // tandai saja sudah dilewati agar tidak memicu notifikasi usang
          await prisma.teacherSchedule.update({
            where: { id: schedule.id },
            data: { notified: true },
          })
        }
      }
    } catch (err) {
      console.error('Failed to process schedule notifications checker:', err)
    }
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  })

  return NextResponse.json({ notifications, unreadCount })
}

