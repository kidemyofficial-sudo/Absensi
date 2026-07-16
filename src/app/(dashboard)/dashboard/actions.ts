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
  const ttl = formData.get('ttl') as string
  const domisili = formData.get('domisili') as string
  const asalSekolah = formData.get('asalSekolah') as string

  if (!name || name.length < 2 || !ttl || !domisili || !asalSekolah) {
    return
  }

  // Create student
  await prisma.student.create({
    data: {
      name,
      ttl,
      domisili,
      asalSekolah,
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
        message: `Siswa baru: ${name} menunggu persetujuan`,
      },
    })
  }

  revalidatePath('/dashboard')
}
