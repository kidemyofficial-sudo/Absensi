import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/reset
 * Hanya OWNER yang bisa akses.
 * Menghapus SEMUA data kecuali akun OWNER itu sendiri.
 * Urutan penghapusan mengikuti FK constraints.
 */
export async function GET() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa akses endpoint ini' }, { status: 403 })
  }

  const log: string[] = []

  try {
    // 1. LessonRevenue (FK ke Lesson)
    const rev = await prisma.lessonRevenue.deleteMany()
    log.push(`✅ Hapus ${rev.count} LessonRevenue`)

    // 2. Lesson (FK ke User.guru dan Student)
    const les = await prisma.lesson.deleteMany()
    log.push(`✅ Hapus ${les.count} Lesson`)

    // 3. Attendance (FK ke Student dan User.guru)
    const att = await prisma.attendance.deleteMany()
    log.push(`✅ Hapus ${att.count} Attendance`)

    // 4. Notification (FK ke User)
    const notif = await prisma.notification.deleteMany()
    log.push(`✅ Hapus ${notif.count} Notification`)

    // 5. AuditLog
    const audit = await prisma.auditLog.deleteMany()
    log.push(`✅ Hapus ${audit.count} AuditLog`)

    // 6. Lepas semua relasi Student ↔ BranchTeacher (many-to-many)
    //    Caranya: update setiap BranchTeacher, disconnect semua student
    const allBts = await prisma.branchTeacher.findMany({
      select: { id: true, student: { select: { id: true } } },
    })
    for (const bt of allBts) {
      if (bt.student.length > 0) {
        await prisma.branchTeacher.update({
          where: { id: bt.id },
          data: { student: { set: [] } },
        })
      }
    }
    log.push(`✅ Disconnect semua relasi Student ↔ BranchTeacher`)

    // 7. BranchTeacher (FK ke User.guru)
    const bt = await prisma.branchTeacher.deleteMany()
    log.push(`✅ Hapus ${bt.count} BranchTeacher`)

    // 8. Student (FK ke User.parent)
    const stu = await prisma.student.deleteMany()
    log.push(`✅ Hapus ${stu.count} Student`)

    // 9. Hapus semua User GURU dan ORANG_TUA (kecuali OWNER)
    const usr = await prisma.user.deleteMany({
      where: { role: { in: ['GURU', 'ORANG_TUA'] } },
    })
    log.push(`✅ Hapus ${usr.count} User (GURU & ORANG_TUA)`)

    log.push(`\n🎉 Reset selesai! Database bersih. Hanya akun Owner yang tersisa.`)

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      log,
    }, { status: 500 })
  }
}
