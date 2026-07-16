import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignSchema = z.object({
  class: z.string().min(1, 'Kelas harus diisi'),
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

    // Update student class
    const updated = await prisma.student.update({
      where: { id },
      data: { class: validatedData.class },
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

      // Find or create classroom teacher
      let classroomTeacher = await prisma.classroomTeacher.findUnique({
        where: {
          userId_className: {
            userId: validatedData.teacherId,
            className: validatedData.class,
          },
        },
      })

      if (!classroomTeacher) {
        // Create new classroom teacher
        classroomTeacher = await prisma.classroomTeacher.create({
          data: {
            userId: validatedData.teacherId,
            className: validatedData.class,
          },
        })
      }

      // Disconnect student from other classroom teachers first
      await prisma.student.update({
        where: { id },
        data: {
          classroomTeachers: {
            disconnect: await prisma.classroomTeacher.findMany({
              where: {
                student: { some: { id } },
              },
              select: { id: true },
            }),
          },
        },
      })

      // Connect student to classroom teacher
      await prisma.classroomTeacher.update({
        where: { id: classroomTeacher.id },
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
        message: `Siswa ${student.name} telah ditugaskan ke kelas ${validatedData.class}`,
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
