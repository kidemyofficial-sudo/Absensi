import { Prisma } from '@prisma/client'
import { generateKodeSiswa } from '@/lib/generate-kode'

const MAX_KODE_SISWA_ATTEMPTS = 5

function isKodeSiswaCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }

  const target = error.meta?.target
  if (Array.isArray(target)) {
    return target.includes('kodeSiswa')
  }

  return target === 'kodeSiswa'
}

export async function withUniqueKodeSiswa<T>(
  createStudent: (kodeSiswa: string) => Promise<T>
): Promise<T> {
  let lastCollision: unknown

  for (let attempt = 0; attempt < MAX_KODE_SISWA_ATTEMPTS; attempt++) {
    try {
      return await createStudent(generateKodeSiswa())
    } catch (error) {
      if (!isKodeSiswaCollision(error)) {
        throw error
      }
      lastCollision = error
    }
  }

  throw lastCollision instanceof Error
    ? lastCollision
    : new Error('Gagal membuat kode siswa unik')
}
