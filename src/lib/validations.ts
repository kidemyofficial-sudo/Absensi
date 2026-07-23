import { z } from 'zod'
import { LESSON_LOCATIONS, MIN_CATATAN_MATERI_LENGTH } from './lesson-options'

// .strict() mencegah field tambahan yang tidak didefinisikan
// Mencegah mass assignment

export const MIN_PASSWORD_LENGTH = 8
export const PASSWORD_REQUIREMENTS_LABEL = 'Minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol'

const strongPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password minimal ${MIN_PASSWORD_LENGTH} karakter`)
  .regex(/[a-z]/, 'Harus ada huruf kecil')
  .regex(/[A-Z]/, 'Harus ada huruf besar')
  .regex(/\d/, 'Harus ada angka')
  .regex(/[^A-Za-z0-9]/, 'Harus ada simbol')

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(max).nullable().optional()
  )

const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().url('URL foto tidak valid').max(2048).nullable().optional()
)

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  password: strongPasswordSchema,
  role: z.enum(['GURU', 'ORANG_TUA'], {
    errorMap: () => ({ message: 'Role tidak valid. Hanya Guru dan Orang Tua yang bisa mendaftar.' }),
  }),
}).strict()

export const loginSchema = z.object({
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  password: z.string().min(1, 'Password harus diisi'),
}).strict()

export const studentSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  ttl: z.string().min(1, 'Tempat tanggal lahir harus diisi'),
  domisili: z.string().min(1, 'Domisili harus diisi'),
  asalSekolah: z.string().min(1, 'Asal sekolah harus diisi'),
  cabangDaerah: z.string().min(1, 'Cabang Daerah harus diisi'),
  parentId: z.string().cuid('ID orang tua tidak valid'),
}).strict()

export const attendanceSchema = z.object({
  studentId: z.string().cuid('ID siswa tidak valid'),
  date: z.string().or(z.date()),
  status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPA']),
  note: z.string().optional(),
}).strict()

export const bulkAttendanceSchema = z.object({
  date: z.string().or(z.date()),
  attendances: z.array(
    z.object({
      studentId: z.string().cuid(),
      status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'ALPA']),
      note: z.string().optional(),
    })
  ),
}).strict()

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type StudentInput = z.infer<typeof studentSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>

export const lessonSchema = z.object({
  tanggalLes: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  studentId: z.string().cuid('ID siswa tidak valid'),
  biayaPerSiswa: z.number().int('Biaya harus bilangan bulat').min(10000, 'Minimal Rp 10.000').max(10000000, 'Maksimal Rp 10.000.000').optional(),
  jenisPembelajaran: z.string().trim().min(1, 'Jenis pembelajaran harus diisi').max(100)
    .refine((value) => value !== 'Lainnya', 'Tulis nama mata pelajaran jika memilih Lainnya'),
  lokasiMengajar: z.enum(LESSON_LOCATIONS, {
    errorMap: () => ({ message: 'Lokasi mengajar tidak valid' }),
  }),
  kelasMurid: optionalTrimmedString(50),
  jumlahMurid: z.number().int('Jumlah murid harus bilangan bulat').min(1, 'Minimal 1 murid').max(100, 'Maksimal 100 murid'),
  namaMurid: z.string().trim().min(1, 'Nama murid harus diisi').max(255),
  catatanMateri: z.string().trim()
    .min(MIN_CATATAN_MATERI_LENGTH, 'Catatan terlalu singkat, jelaskan aktivitas dan materi lebih detail')
    .max(2000),
  kritikSaran: optionalTrimmedString(2000),
  fotoUrl: optionalUrl,
  jamMulai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'),
  jamSelesai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam harus HH:MM'),
  namaWaliMurid: z.string().trim().min(1, 'Nama wali murid harus diisi').max(255),
  whatsappWaliMurid: optionalTrimmedString(20),
}).strict()

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
}).strict()

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPasswordSchema,
}).strict()

export const revenueSettingsSchema = z.object({
  studentId: z.string().cuid('ID siswa tidak valid'),
  branchTeacherId: z.string().cuid('ID guru cabang tidak valid').optional(),
  biayaPerSiswa: z.number().int('Biaya harus bilangan bulat').min(0, 'Biaya tidak boleh negatif').max(10000000, 'Maksimal Rp 10.000.000'),
  nominalOwner: z.number().int('Nominal owner harus bilangan bulat').min(0, 'Nominal owner tidak boleh negatif').optional(),
  nominalGuru: z.number().int('Nominal guru harus bilangan bulat').min(0, 'Nominal guru tidak boleh negatif').optional(),
}).strict().refine(
  (data) =>
    (data.nominalOwner === undefined && data.nominalGuru === undefined) ||
    (data.nominalOwner !== undefined && data.nominalGuru !== undefined),
  {
    message: 'Nominal owner dan guru harus diisi lengkap',
    path: ['nominalGuru'],
  }
).refine(
  (data) =>
    data.nominalOwner === undefined ||
    data.nominalGuru === undefined ||
    data.branchTeacherId !== undefined,
  {
    message: 'Guru cabang harus dipilih untuk mengubah nominal bagi hasil',
    path: ['branchTeacherId'],
  }
).refine(
  (data) =>
    data.nominalOwner === undefined ||
    data.nominalGuru === undefined ||
    data.nominalOwner + data.nominalGuru === data.biayaPerSiswa,
  {
    message: 'Total Nominal Owner + Nominal Guru harus sama dengan Biaya Per Siswa',
    path: ['nominalGuru'],
  }
)

export const assignSchema = z.object({
  cabangDaerah: z.string().min(1),
  provinsi: z.string().min(1),
  kotaKabupaten: z.string().min(1),
  teacherId: z.string().optional(),
  mataPelajaran: z.string().optional(),
}).strict()
