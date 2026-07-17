import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/^(?=.*[a-z])/, 'Harus ada huruf kecil')
    .regex(/^(?=.*[A-Z])/, 'Harus ada huruf besar')
    .regex(/^(?=.*\d)/, 'Harus ada angka'),
  role: z.enum(['GURU', 'ORANG_TUA'], {
    errorMap: () => ({ message: 'Role tidak valid. Hanya Guru dan Orang Tua yang bisa mendaftar.' }),
  }),
})

export const loginSchema = z.object({
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  password: z.string().min(1, 'Password harus diisi'),
})

export const studentSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  ttl: z.string().min(1, 'Tempat tanggal lahir harus diisi'),
  domisili: z.string().min(1, 'Domisili harus diisi'),
  asalSekolah: z.string().min(1, 'Asal sekolah harus diisi'),
  cabangDaerah: z.string().min(1, 'Cabang Daerah harus diisi'),
  parentId: z.string().cuid('ID orang tua tidak valid'),
})

export const attendanceSchema = z.object({
  studentId: z.string().cuid('ID siswa tidak valid'),
  date: z.string().or(z.date()),
  status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPA']),
  note: z.string().optional(),
})

export const bulkAttendanceSchema = z.object({
  date: z.string().or(z.date()),
  attendances: z.array(
    z.object({
      studentId: z.string().cuid(),
      status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPA']),
      note: z.string().optional(),
    })
  ),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type StudentInput = z.infer<typeof studentSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>

export const lessonSchema = z.object({
  tanggalLes: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  studentId: z.string().cuid().optional().nullable(), // Relasi ke student
  jenisPembelajaran: z.string().min(1, 'Jenis pembelajaran harus diisi').max(100),
  lokasiMengajar: z.string().min(1, 'Lokasi mengajar harus diisi').max(100),
  kelasMurid: z.string().max(50).optional().nullable(),
  jumlahMurid: z.number().int('Jumlah murid harus bilangan bulat').min(1, 'Minimal 1 murid').max(100, 'Maksimal 100 murid'),
  namaMurid: z.string().min(1, 'Nama murid harus diisi').max(255),
  catatanMateri: z.string().min(1, 'Catatan materi harus diisi').max(2000),
  fotoUrl: z.string().url('URL foto tidak valid').optional().nullable(),
  jamMulai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'),
  jamSelesai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'),
  namaWaliMurid: z.string().min(1, 'Nama wali murid harus diisi').max(255),
  whatsappWaliMurid: z.string().max(20).optional().nullable(),
})
