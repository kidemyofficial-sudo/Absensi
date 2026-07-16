import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignSchema = z.object({
  class: z.string().min(1, 'Kelas harus diisi'),
  classroomTeacherId: z.string().optional(),
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

    // Assign to classroom teacher if provided
    if (validatedData.classroomTeacherId) {
      // Check if classroom teacher exists for this class
      const classroomTeacher = await prisma.classroomTeacher.findFirst({
        where: {
          id: validatedData.classroomTeacherId,
          className: validatedData.class,
        },
      })

      if (!classroomTeacher) {
        return NextResponse.json(
          { error: 'Guru tidak mengampu kelas ini' },
          { status: 400 }
        )
      }

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
