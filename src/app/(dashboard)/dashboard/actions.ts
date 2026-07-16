'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function registerStudent(formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return
  }

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'ORANG_TUA') {
    return
  }

  const name = formData.get('name') as string
  const nis = formData.get('nis') as string

  if (!name || name.length < 2 || !nis) {
    return
  }

  // Check if NIS already exists
  const existing = await prisma.student.findUnique({
    where: { nis },
  })

  if (existing) {
    return
  }

  // Create student
  await prisma.student.create({
    data: {
      name,
      nis,
      parentId: payload.userId,
      status: 'PENDING',
    },
  })

  // Notify owners
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    select: { id: true },
  })

  for (const owner of owners) {
    await prisma.notification.create({
      data: {
        userId: owner.id,
        message: `Siswa baru: ${name} (NIS: ${nis}) menunggu persetujuan`,
      },
    })
  }

  revalidatePath('/dashboard')
}
