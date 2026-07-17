import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignSchema = z.object({
  cabangDaerah: z.string().min(1, 'Cabang Daerah harus diisi'),
  teacherId: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang bisa mengassign' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const validatedData = assignSchema.parse(body)

    const student = await prisma.student.findUnique({
      where: { id },
    })

    if (!student) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    }

    if (student.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Siswa harus disetujui terlebih dahulu' },
        { status: 400 }
      )
    }

    // Update student cabangDaerah
    const updated = await prisma.student.update({
      where: { id },
      data: { cabangDaerah: validatedData.cabangDaerah },
    })

    // Assign to teacher if provided
    if (validatedData.teacherId) {
      // Check if teacher exists
      const teacher = await prisma.user.findUnique({
        where: { id: validatedData.teacherId },
      })

      if (!teacher || teacher.role !== 'GURU') {
        return NextResponse.json(
          { error: 'Guru tidak ditemukan' },
          { status: 400 }
        )
      }

      // Find or create branch teacher
      let branchTeacher = await prisma.branchTeacher.findUnique({
        where: {
          userId_cabangDaerah: {
            userId: validatedData.teacherId,
            cabangDaerah: validatedData.cabangDaerah,
          },
        },
      })

      if (!branchTeacher) {
        // Create new branch teacher
        branchTeacher = await prisma.branchTeacher.create({
          data: {
            userId: validatedData.teacherId,
            cabangDaerah: validatedData.cabangDaerah,
          },
        })
      }

      // Disconnect student from other branch teachers first
      await prisma.student.update({
        where: { id },
        data: {
          branchTeachers: {
            disconnect: await prisma.branchTeacher.findMany({
              where: {
                student: { some: { id } },
              },
              select: { id: true },
            }),
          },
        },
      })

      // Connect student to branch teacher
      await prisma.branchTeacher.update({
        where: { id: branchTeacher.id },
        data: {
          student: {
            connect: { id },
          },
        },
      })
    }

    // Notify parent
    await prisma.notification.create({
      data: {
        userId: student.parentId,
        message: `Siswa ${student.name} telah ditugaskan ke cabang daerah ${validatedData.cabangDaerah}`,
      },
    })

    return NextResponse.json({ student: updated })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.message },
        { status: 400 }
      )
    }
    console.error('Assign student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
