import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z, ZodError } from 'zod'

const assignSchema = z.object({
  cabangDaerah: z.string().min(1, 'Cabang Daerah harus diisi'),
  provinsi: z.string().min(1, 'Provinsi harus diisi'),
  kotaKabupaten: z.string().min(1, 'Kota/Kabupaten harus diisi'),
  teacherId: z.string().optional(),
  mataPelajaran: z.string().optional(),
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

    let teacher: { id: string; role: string } | null = null
    if (validatedData.teacherId) {
      teacher = await prisma.user.findUnique({
        where: { id: validatedData.teacherId },
      })

      if (!teacher || teacher.role !== 'GURU') {
        return NextResponse.json(
          { error: 'Guru tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update cabangDaerah on the student
      const updatedStudent = await tx.student.update({
        where: { id },
        data: { cabangDaerah: validatedData.cabangDaerah },
      })

      if (teacher) {
        // 2. Upsert BranchTeacher (shared per guru+cabang, NO mataPelajaran here)
        const branchTeacher = await tx.branchTeacher.upsert({
          where: {
            userId_cabangDaerah: {
              userId: validatedData.teacherId!,
              cabangDaerah: validatedData.cabangDaerah,
            },
          },
          create: {
            userId: validatedData.teacherId!,
            cabangDaerah: validatedData.cabangDaerah,
            provinsi: validatedData.provinsi,
            kotaKabupaten: validatedData.kotaKabupaten,
          },
          update: {
            provinsi: validatedData.provinsi,
            kotaKabupaten: validatedData.kotaKabupaten,
          },
        })

        // 3. Disconnect any existing StudentTeacher links for this student
        //    so we replace the previous teacher assignment with the new one
        await tx.studentTeacher.deleteMany({
          where: { studentId: id },
        })

        // 4. Create StudentTeacher record with mataPelajaran SPECIFIC to this student
        await tx.studentTeacher.create({
          data: {
            studentId: id,
            branchTeacherId: branchTeacher.id,
            mataPelajaran: validatedData.mataPelajaran || 'Umum',
          },
        })
      } else {
        // No teacher selected — clear existing student-teacher links
        await tx.studentTeacher.deleteMany({
          where: { studentId: id },
        })
      }

      return updatedStudent
    })

    await prisma.notification.create({
      data: {
        userId: student.parentId,
        message: `Siswa ${student.name} telah ditugaskan ke cabang daerah ${validatedData.cabangDaerah}`,
      },
    })

    return NextResponse.json({ student: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Data tidak valid' },
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
