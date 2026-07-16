import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { id } = await params

  const notification = await prisma.notification.findUnique({
    where: { id },
  })

  if (!notification) {
    return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 })
  }

  if (notification.userId !== user.id) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })

  return NextResponse.json({ notification: updated })
}
