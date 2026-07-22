import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revenueSettingsSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function GET() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya owner yang dapat mengakses' }, { status: 403 })
  }

  // Ambil semua siswa yang sudah punya cabang + persentase dari branch teacher
  const students = await prisma.student.findMany({
    where: { status: 'APPROVED' },
    include: {
      parent: {
        select: { id: true, name: true },
      },
      branchTeachers: {
        select: {
          id: true,
          persentaseOwner: true,
          persentaseGuru: true,
          mataPelajaran: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ students })
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya owner yang dapat mengatur pengaturan ini' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { applyToExisting, ...settingsData } = body
    const validatedData = revenueSettingsSchema.parse(settingsData)

    let updatedCount = 0

    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id: validatedData.studentId },
        data: { biayaPerSiswa: validatedData.biayaPerSiswa },
        include: {
          parent: { select: { id: true, name: true } },
          branchTeachers: {
            select: {
              id: true,
              persentaseOwner: true,
              persentaseGuru: true,
              mataPelajaran: true,
              user: { select: { name: true } },
            },
          },
        },
      })

      if (
        validatedData.branchTeacherId &&
        validatedData.persentaseOwner !== undefined &&
        validatedData.persentaseGuru !== undefined
      ) {
        const branchTeacher = await tx.branchTeacher.findFirst({
          where: {
            id: validatedData.branchTeacherId,
            student: { some: { id: validatedData.studentId } },
          },
          select: { id: true },
        })

        if (!branchTeacher) {
          throw new Error('BRANCH_TEACHER_NOT_FOUND')
        }

        await tx.branchTeacher.update({
          where: { id: validatedData.branchTeacherId },
          data: {
            persentaseOwner: validatedData.persentaseOwner,
            persentaseGuru: validatedData.persentaseGuru,
          },
        })

        // Jika applyToExisting = true, hitung ulang semua laporan les siswa ini
        if (applyToExisting === true) {
          const existingRevenues = await tx.lessonRevenue.findMany({
            where: {
              lesson: { studentId: validatedData.studentId },
            },
            select: {
              id: true,
              biayaPerSesi: true,
              jumlahMurid: true,
            },
          })

          for (const rev of existingRevenues) {
            const biayaTotal = rev.biayaPerSesi * rev.jumlahMurid
            // Gunakan Math.round agar tidak ada selisih sisa rupiah
            const pendapatanOwner = Math.round(biayaTotal * validatedData.persentaseOwner! / 100)
            const pendapatanGuru = Math.round(biayaTotal * validatedData.persentaseGuru! / 100)
            await tx.lessonRevenue.update({
              where: { id: rev.id },
              data: {
                persentaseOwner: validatedData.persentaseOwner,
                persentaseGuru: validatedData.persentaseGuru,
                pendapatanOwner,
                pendapatanGuru,
              },
            })
          }

          updatedCount = existingRevenues.length
        }

        return tx.student.findUniqueOrThrow({
          where: { id: validatedData.studentId },
          include: {
            parent: { select: { id: true, name: true } },
            branchTeachers: {
              select: {
                id: true,
                persentaseOwner: true,
                persentaseGuru: true,
                mataPelajaran: true,
                user: { select: { name: true } },
              },
            },
          },
        })
      }

      return student
    })

    return NextResponse.json({ student: updated, updatedCount })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'BRANCH_TEACHER_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Guru cabang tidak ditemukan untuk siswa ini' },
        { status: 400 }
      )
    }
    console.error('Update revenue settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
