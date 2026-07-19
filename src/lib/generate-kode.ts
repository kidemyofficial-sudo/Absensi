import { randomInt } from 'crypto'

/**
 * Generate kode siswa acak format: STD-XXXXX
 * Menggunakan karakter alfanumerik (kecuali huruf mirip: 0, O, I, l, 1)
 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const KODE_SISWA_PREFIX = 'STD-'
const KODE_SISWA_LENGTH = 5

export function generateKodeSiswa(): string {
  let kode = KODE_SISWA_PREFIX
  for (let i = 0; i < KODE_SISWA_LENGTH; i++) {
    kode += CHARS.charAt(randomInt(CHARS.length))
  }
  return kode
}
