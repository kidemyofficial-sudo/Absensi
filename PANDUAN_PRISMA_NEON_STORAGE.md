# Panduan Prisma, Neon, dan Storage Siswa

Dokumen ini menjelaskan konfigurasi yang dipakai proyek untuk fitur `Storage` siswa, cara menjalankan update schema database dengan aman, dan hal yang perlu disiapkan di lingkungan lokal maupun Vercel.

## Tujuan perubahan

Fitur `Storage` siswa membutuhkan kolom baru di tabel `Student`:

- `isArchived`
- `archivedAt`

Kode aplikasi sudah menggunakan kolom tersebut untuk:

- memisahkan tab `Aktif` dan `Storage`
- mendukung `Hapus Sementara`
- menjaga agar data aktif tidak tampil dobel saat schema belum sinkron

## Kenapa perlu `DIRECT_URL`

Untuk Neon, koneksi aplikasi dan koneksi Prisma CLI sebaiknya dipisah:

- `DATABASE_URL`: dipakai aplikasi saat runtime, tetap menggunakan host `-pooler`
- `DIRECT_URL`: dipakai Prisma CLI seperti `prisma db push`, memakai host Neon direct tanpa `-pooler`

Pendekatan ini membantu menghindari kegagalan `P1001` saat Prisma CLI mencoba update schema lewat koneksi yang kurang cocok untuk operasi schema.

## Contoh konfigurasi `.env`

Contoh umum:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15"
JWT_SECRET="isi-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Aturannya:

- `DATABASE_URL` harus tetap memakai host yang ada `-pooler`
- `DIRECT_URL` harus memakai host direct tanpa `-pooler`
- jangan commit file `.env`
- jangan gunakan `--force-reset`

## Perubahan schema Prisma

File `prisma/schema.prisma` sekarang memakai:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Dengan konfigurasi ini:

- aplikasi tetap memakai pooled connection
- Prisma CLI memakai direct connection untuk `db push`

## Langkah update database yang aman

Jalankan langkah berikut dari root project:

```bash
npx prisma db push
```

Atau:

```bash
npm run db:push
```

Catatan:

- perintah ini aman untuk sinkronisasi schema tanpa reset data
- jangan jalankan `prisma migrate reset`
- jangan jalankan `prisma db push --force-reset`

## Kalau muncul error `P1001`

Jika muncul error seperti:

```text
P1001: Can't reach database server
```

Cek hal berikut:

- host database Neon bisa diakses
- `DATABASE_URL` dan `DIRECT_URL` benar
- `DIRECT_URL` tidak memakai `-pooler`
- parameter `connect_timeout` sudah ada
- database yang dipakai lokal sama dengan database yang dipakai deployment

## Untuk Vercel

Jika project dideploy ke Vercel, siapkan environment variable berikut:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `NEXTAUTH_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Catatan penting:

- `DATABASE_URL` di Vercel tetap memakai koneksi Neon `pooler`
- `DIRECT_URL` di Vercel memakai koneksi direct Neon
- bila schema sudah di-push dari lokal ke database production yang sama, biasanya tidak perlu `db push` lagi di Vercel

## Cara cek hasil fitur Storage

Setelah schema database sinkron:

1. Buka halaman `Siswa`
2. Pastikan tab `Aktif` hanya menampilkan siswa aktif
3. Pastikan tab `Storage` kosong jika belum ada siswa yang dihapus sementara
4. Coba `Hapus Sementara` pada satu siswa uji
5. Pastikan siswa pindah dari `Aktif` ke `Storage`
6. Pastikan tidak ada efek data tampil dobel

## Ringkasan cepat

- runtime aplikasi: pakai `DATABASE_URL` dengan host `-pooler`
- Prisma CLI: pakai `DIRECT_URL` tanpa `-pooler`
- update schema: pakai `npx prisma db push`
- keamanan data: jangan gunakan perintah reset database
