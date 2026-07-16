# Sistem Absensi Sekolah

Sistem absensi sekolah berbasis web dengan Next.js, Prisma, dan PostgreSQL.

## Fitur

- **Autentikasi**: Register/Login dengan JWT (3 role: Owner, Guru, Orang Tua)
- **Dashboard**: Statistik dan ringkasan per role
- **Manajemen Siswa**: CRUD data siswa (Owner only)
- **Input Absensi**: Form absensi per kelas (Guru only)
- **Laporan**: Rekap absensi dengan filter dan export CSV
- **Notifikasi**: Notifikasi otomatis ke Orang Tua saat anak absen
- **Mobile Responsive**: UI responsif untuk semua perangkat

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Auth**: JWT (jose) + bcryptjs
- **Deployment**: Vercel

## Setup Lokal

### Prerequisites

- Node.js 18+
- PostgreSQL database (local atau Neon)

### Instalasi

```bash
# Clone repository
git clone https://github.com/kidemyofficial-sudo/Absensi.git
cd Absensi

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan database URL Anda

# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# Jalankan development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
JWT_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Deployment ke Vercel

### 1. Buat Database di Neon

1. Buat akun di [Neon](https://neon.tech)
2. Buat project baru
3. Copy connection string dari dashboard

### 2. Deploy ke Vercel

1. Push kode ke GitHub
2. Login ke [Vercel](https://vercel.com)
3. Import repository `kidemyofficial-sudo/Absensi`
4. Tambahkan environment variables:
   - `DATABASE_URL`: Connection string dari Neon
   - `JWT_SECRET`: Secret key untuk JWT
5. Deploy

### 3. Setup Database

Setelah deploy, jalankan Prisma setup:

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Jalankan di production
vercel env pull .env.local
npx prisma generate
npx prisma db push
```

## API Documentation

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user baru |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Dapatkan user saat ini |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Data dashboard berdasarkan role |

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students | List siswa |
| POST | /api/students | Tambah siswa (OWNER) |
| GET | /api/students/[id] | Detail siswa |
| PUT | /api/students/[id] | Edit siswa (OWNER) |
| DELETE | /api/students/[id] | Hapus siswa (OWNER) |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/attendance | List absensi |
| POST | /api/attendance | Input absensi (GURU) |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports | Laporan absensi |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifikasi |
| PATCH | /api/notifications/[id] | Tandai sudah dibaca |

## Database Schema

```prisma
enum Role { GURU ORANG_TUA OWNER }
enum AttendanceStatus { HADIR IZIN SAKIT ALPA }

model User {
  id, name, email, password, role
}

model Student {
  id, name, nis, class, parentId
}

model Attendance {
  id, studentId, teacherId, date, status, note
}

model Notification {
  id, userId, message, isRead
}

model ClassroomTeacher {
  id, userId, className
}
```

## License

MIT
