import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/lessons/filters
 * Mengembalikan daftar nama guru & siswa yang unik untuk dropdown filter.
 * Query langsung ke DB tanpa load semua lessons → cepat & efisien selamanya.
 */
export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  // Untuk OWNER: ambil semua nama guru & siswa unik dari tabel Lesson
  // Untuk GURU: hanya nama siswa yang pernah diajar guru tersebut
  const whereGuru =
    user.role === 'GURU' ? { guruId: user.id } : {}

  const whereSiswa =
    user.role === 'GURU' ? { guruId: user.id } : {}

  // Ambil nama guru unik (distinct)
  const guruList = await prisma.lesson.findMany({
    where: whereGuru,
    select: { namaGuru: true },
    distinct: ['namaGuru'],
    orderBy: { namaGuru: 'asc' },
  })

  // Ambil nama siswa unik (distinct)
  const siswaList = await prisma.lesson.findMany({
    where: whereSiswa,
    select: { namaMurid: true, namaGuru: true },
    distinct: ['namaMurid', 'namaGuru'],
    orderBy: { namaMurid: 'asc' },
  })

  return NextResponse.json({
    guruNames: guruList.map((g) => g.namaGuru),
    // Kirim pasangan siswa-guru agar frontend bisa filter siswa berdasarkan guru terpilih
    siswaOptions: siswaList.map((s) => ({
      namaMurid: s.namaMurid,
      namaGuru: s.namaGuru,
    })),
  })
}
