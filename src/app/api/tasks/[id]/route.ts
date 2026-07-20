import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Tidak terautentikasi atau bukan Guru' }, { status: 401 })
  }

  const { id } = await params

  try {
    const { title, isCompleted } = await request.json()

    // Ambil tugas dan pastikan pemiliknya adalah user aktif
    const task = await prisma.myTask.findUnique({ where: { id } })

    if (!task) {
      return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 })
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Bukan pemilik tugas ini' }, { status: 403 })
    }

    const updatedTask = await prisma.myTask.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(isCompleted !== undefined && { isCompleted }),
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json({ error: 'Gagal memperbarui tugas' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ error: 'Tidak terautentikasi atau bukan Guru' }, { status: 401 })
  }

  const { id } = await params

  try {
    const task = await prisma.myTask.findUnique({ where: { id } })

    if (!task) {
      return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 })
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Bukan pemilik tugas ini' }, { status: 403 })
    }

    await prisma.myTask.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json({ error: 'Gagal menghapus tugas' }, { status: 500 })
  }
}
