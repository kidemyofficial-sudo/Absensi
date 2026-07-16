import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password harus minimal 6 karakter'),
  role: z.enum(['GURU', 'ORANG_TUA'], {
    errorMap: () => ({ message: 'Role tidak valid. Hanya Guru dan Orang Tua yang bisa mendaftar.' }),
  }),
})

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
})

export const studentSchema = z.object({
  name: z.string().min(2, 'Nama harus minimal 2 karakter'),
  nis: z.string().min(1, 'NIS harus diisi'),
  class: z.string().min(1, 'Kelas harus diisi'),
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
