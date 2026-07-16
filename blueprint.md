# Sistem Absensi Sekolah - PROYEK SELESAI ✅

## Tech Stack
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (jose) + bcryptjs
- **Testing**: Jest + @testing-library/react

## Status: SEMUA SLICE SELESAI ✅

### Slice 1: Auth ✅
- [x] Project setup (Next.js, TypeScript, Tailwind)
- [x] Prisma schema (User, Student, Attendance, Notification, ClassroomTeacher)
- [x] Auth helpers (hashPassword, verifyPassword, createToken, verifyToken)
- [x] API Routes: /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me
- [x] Login page dengan form
- [x] Register page dengan role selection
- [x] Dashboard layout dengan nav bar
- [x] Middleware untuk route protection
- [x] Unit tests untuk auth (4 tests passing)

### Slice 2: Dashboard ✅
- [x] Dashboard owner: statistik siswa, guru, absensi hari ini
- [x] Dashboard guru: daftar kelas yang diampu, tombol input absensi
- [x] Dashboard orang tua: status absensi anak hari ini
- [x] API: GET /api/dashboard (role-based response)

### Slice 3: Manajemen Siswa ✅
- [x] CRUD siswa API (GET, POST, PUT, DELETE)
- [x] Tabel siswa + form tambah/edit
- [x] Relasi Student → Parent
- [x] Search & filter by kelas

### Slice 4: Input Absensi ✅
- [x] Form absensi per kelas
- [x] Checklist hadir/izin/sakit/alpa
- [x] Validasi satu record per siswa per hari (upsert)
- [x] Bulk attendance API
- [x] Notifikasi otomatis ke orang tua

### Slice 5: Laporan Absensi ✅
- [x] Rekap absensi per periode
- [x] Filter tanggal/kelas/siswa
- [x] View ringkasan & detail
- [x] Export CSV

### Slice 6: Notifikasi ✅
- [x] Notifikasi otomatis ke orang tua saat guru input absensi
- [x] API GET /api/notifications
- [x] API PATCH /api/notifications/[id] (tandai sudah dibaca)

### Slice 7: Final Polish ✅
- [x] Notification bell icon dengan badge count
- [x] Mobile responsive (semua halaman)
- [x] API documentation di blueprint.md

---

## Cara Menjalankan

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Jalankan dev server
npm run dev

# Jalankan tests
npm test
```

## Database Schema

```prisma
enum Role { GURU ORANG_TUA OWNER }
enum AttendanceStatus { HADIR IZIN SAKIT ALPA }

model User { id, name, email, password, role }
model Student { id, name, nis, class, parentId }
model Attendance { id, studentId, teacherId, date, status, note }
model Notification { id, userId, message, isRead }
model ClassroomTeacher { id, userId, className }
```

## API Documentation

### Auth
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dapatkan user saat ini

### Dashboard
- `GET /api/dashboard` - Data dashboard berdasarkan role

### Students
- `GET /api/students` - List siswa (filter: class, search)
- `POST /api/students` - Tambah siswa (OWNER only)
- `GET /api/students/[id]` - Detail siswa
- `PUT /api/students/[id]` - Edit siswa (OWNER only)
- `DELETE /api/students/[id]` - Hapus siswa (OWNER only)

### Attendance
- `GET /api/attendance` - List absensi (filter: date, class, studentId)
- `POST /api/attendance` - Input absensi bulk (GURU only)

### Reports
- `GET /api/reports` - Laporan absensi (filter: startDate, endDate, class, studentId)

### Notifications
- `GET /api/notifications` - List notifikasi user
- `PATCH /api/notifications/[id]` - Tandai sudah dibaca

## File Structure

```
absensi/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── students/page.tsx
│   │   │   ├── attendance/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── dashboard/route.ts
│   │   │   ├── students/
│   │   │   ├── attendance/route.ts
│   │   │   ├── reports/route.ts
│   │   │   └── notifications/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── LogoutButton.tsx
│   │   └── NotificationBell.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── validations.ts
│   └── middleware.ts
├── tests/
│   └── lib/auth.test.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── jest.config.ts
```

## Definition of Done (DoD) - SEMUA TERPENUHI ✅

- [x] Semua fungsi berjalan
- [x] Tidak ada bug kritis
- [x] UI responsif (mobile-first)
- [x] API terdokumentasi
- [x] Pengujian utama lulus (4/4 tests)
- [x] Build berhasil (19 routes)
