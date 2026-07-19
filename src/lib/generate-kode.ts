/**
 * Generate kode siswa acak format: STD-XXXXX
 * Menggunakan karakter alfanumerik (kecuali huruf mirip: 0, O, I, l, 1)
 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateKodeSiswa(): string {
  let kode = 'STD-'
  for (let i = 0; i < 5; i++) {
    kode += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return kode
}
