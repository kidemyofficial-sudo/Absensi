'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitize } from '@/lib/sanitize'
import { withUniqueKodeSiswa } from '@/lib/student-code'

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

  const name = String(formData.get('name') || '').trim()
  const ttl = String(formData.get('ttl') || '').trim()
  const domisili = String(formData.get('domisili') || '').trim()
  const asalSekolah = String(formData.get('asalSekolah') || '').trim()

  if (!name || name.length < 2 || !ttl || !domisili || !asalSekolah) {
    return
  }

  const safeName = sanitize(name)
  const safeTtl = sanitize(ttl)
  const safeDomisili = sanitize(domisili)
  const safeAsalSekolah = sanitize(asalSekolah)

  // Create student with random kode
  await withUniqueKodeSiswa((kodeSiswa) =>
    prisma.student.create({
      data: {
        name: safeName,
        kodeSiswa,
        ttl: safeTtl,
        domisili: safeDomisili,
        asalSekolah: safeAsalSekolah,
        parentId: payload.userId,
        status: 'PENDING',
      },
    })
  )

  // Notify owners
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    select: { id: true },
  })

  for (const owner of owners) {
    await prisma.notification.create({
      data: {
        userId: owner.id,
        message: `Siswa baru: ${safeName} menunggu persetujuan`,
      },
    })
  }

  revalidatePath('/dashboard')
}
