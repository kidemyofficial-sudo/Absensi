import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateKodeSiswa(): string {
  let kode = 'STD-'
  for (let i = 0; i < 5; i++) {
    kode += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return kode
}

const prisma = new PrismaClient()

async function main() {
  console.log('Menghapus semua data...')
  await prisma.lessonRevenue.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.student.deleteMany()
  await prisma.branchTeacher.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()
  console.log('Semua data berhasil dihapus.\n')

  // === 1. BUAT OWNER ===
  const hashedPasswordOwner = await bcrypt.hash('admin123456', 12)
  const owner = await prisma.user.create({
    data: {
      name: 'Owner/Admin',
      phone: '081234567890',
      password: hashedPasswordOwner,
      role: 'OWNER',
    },
  })

  // === 2. BUAT 5 GURU ===
  const hashedPasswordGuru = await bcrypt.hash('guru123456', 12)

  const guruData = [
    { name: 'Dadan Satria', phone: '081234567891' },
    { name: 'Rahayu', phone: '081234567892' },
    { name: 'Ahmad Fauzi', phone: '081234567893' },
    { name: 'Siti Nurhaliza', phone: '081234567894' },
    { name: 'Budi Santoso', phone: '081234567895' },
  ]

  const guruList = []
  for (const g of guruData) {
    const guru = await prisma.user.create({
      data: {
        name: g.name,
        phone: g.phone,
        password: hashedPasswordGuru,
        role: 'GURU',
      },
    })
    guruList.push(guru)
    console.log(`Guru dibuat: ${guru.name} (${guru.phone})`)
  }

  // === 3. BUAT 5 ORANG TUA ===
  const hashedPasswordOrtu = await bcrypt.hash('ortu123456', 12)

  const ortuData = [
    { name: 'Budi Hartono', phone: '082111111111' },
    { name: 'Siti Rahmawati', phone: '082122222222' },
    { name: 'Andi Wijaya', phone: '082133333333' },
    { name: 'Dewi Lestari', phone: '082144444444' },
    { name: 'Rudi Pratama', phone: '082155555555' },
  ]

  const ortuList = []
  for (const o of ortuData) {
    const ortu = await prisma.user.create({
      data: {
        name: o.name,
        phone: o.phone,
        password: hashedPasswordOrtu,
        role: 'ORANG_TUA',
      },
    })
    ortuList.push(ortu)
    console.log(`Orang Tua dibuat: ${ortu.name} (${ortu.phone})`)
  }

  // === 4. BUAT 12 SISWA (2-3 per orang tua) ===
  const siswaData = [
    // Orang Tua 1: Budi Hartono (2 anak)
    { name: 'Ahmad Rizki', ttl: 'Surabaya, 15 Januari 2012', domisili: 'Surabaya', asalSekolah: 'SDN 01 Surabaya', biayaPerSiswa: 70000, parentIdx: 0 },
    { name: 'Aisha Putri', ttl: 'Surabaya, 20 Maret 2013', domisili: 'Surabaya', asalSekolah: 'SDN 02 Surabaya', biayaPerSiswa: 65000, parentIdx: 0 },
    // Orang Tua 2: Siti Rahmawati (3 anak)
    { name: 'Muhammad Fadil', ttl: 'Sidoarjo, 10 Februari 2011', domisili: 'Sidoarjo', asalSekolah: 'SDN 03 Sidoarjo', biayaPerSiswa: 50000, parentIdx: 1 },
    { name: 'Naura Azzahra', ttl: 'Sidoarjo, 5 April 2012', domisili: 'Sidoarjo', asalSekolah: 'SDN 04 Sidoarjo', biayaPerSiswa: 55000, parentIdx: 1 },
    { name: 'Zainuddin', ttl: 'Sidoarjo, 18 Agustus 2013', domisili: 'Sidoarjo', asalSekolah: 'SDN 05 Sidoarjo', biayaPerSiswa: 45000, parentIdx: 1 },
    // Orang Tua 3: Andi Wijaya (2 anak)
    { name: 'Rina Amelia', ttl: 'Surabaya, 22 Juni 2011', domisili: 'Surabaya', asalSekolah: 'SMPN 01 Surabaya', biayaPerSiswa: 80000, parentIdx: 2 },
    { name: 'Farhan Maulana', ttl: 'Surabaya, 30 September 2012', domisili: 'Surabaya', asalSekolah: 'SMPN 02 Surabaya', biayaPerSiswa: 75000, parentIdx: 2 },
    // Orang Tua 4: Dewi Lestari (3 anak)
    { name: 'Citra Dewi', ttl: 'Sidoarjo, 12 Mei 2011', domisili: 'Sidoarjo', asalSekolah: 'SDN 06 Sidoarjo', biayaPerSiswa: 60000, parentIdx: 3 },
    { name: 'Raka Pratama', ttl: 'Sidoarjo, 8 November 2012', domisili: 'Sidoarjo', asalSekolah: 'SDN 07 Sidoarjo', biayaPerSiswa: 50000, parentIdx: 3 },
    { name: 'Lestari Putri', ttl: 'Sidoarjo, 25 Desember 2013', domisili: 'Sidoarjo', asalSekolah: 'SDN 08 Sidoarjo', biayaPerSiswa: 40000, parentIdx: 3 },
    // Orang Tua 5: Rudi Pratama (2 anak)
    { name: 'Gilang Ramadhan', ttl: 'Surabaya, 14 Februari 2011', domisili: 'Surabaya', asalSekolah: 'SMPN 03 Surabaya', biayaPerSiswa: 85000, parentIdx: 4 },
    { name: 'Maya Sari', ttl: 'Surabaya, 7 Juli 2012', domisili: 'Surabaya', asalSekolah: 'SMPN 04 Surabaya', biayaPerSiswa: 70000, parentIdx: 4 },
  ]

  const siswaList = []
  for (const s of siswaData) {
    const siswa = await prisma.student.create({
      data: {
        name: s.name,
        kodeSiswa: generateKodeSiswa(),
        ttl: s.ttl,
        domisili: s.domisili,
        asalSekolah: s.asalSekolah,
        parentId: ortuList[s.parentIdx].id,
        biayaPerSiswa: s.biayaPerSiswa,
        status: 'APPROVED',
      },
    })
    siswaList.push(siswa)
    console.log(`Siswa dibuat: ${siswa.name} (biaya: Rp${s.biayaPerSiswa.toLocaleString()})`)
  }

  // === 5. BUAT 2 CABANG DAERAH + ASSIGN GURU ===
  // Cabang 1: Sidoarjo (3 guru)
  const branchSidoarjo = [
    { guruIdx: 0, mataPelajaran: 'Matematika', persentaseOwner: 40, persentaseGuru: 60 },
    { guruIdx: 1, mataPelajaran: 'IPS', persentaseOwner: 40, persentaseGuru: 60 },
    { guruIdx: 2, mataPelajaran: 'Bahasa Indonesia', persentaseOwner: 35, persentaseGuru: 65 },
  ]

  // Cabang 2: Surabaya (3 guru, beberapa sama dengan Sidoarjo)
  const branchSurabaya = [
    { guruIdx: 2, mataPelajaran: 'Matematika', persentaseOwner: 40, persentaseGuru: 60 },
    { guruIdx: 3, mataPelajaran: 'Bahasa Inggris', persentaseOwner: 45, persentaseGuru: 55 },
    { guruIdx: 4, mataPelajaran: 'IPA', persentaseOwner: 50, persentaseGuru: 50 },
  ]

  for (const b of branchSidoarjo) {
    const bt = await prisma.branchTeacher.create({
      data: {
        userId: guruList[b.guruIdx].id,
        cabangDaerah: 'Kota Sidoarjo, Jawa Timur',
        provinsi: 'Jawa Timur',
        kotaKabupaten: 'Kota Sidoarjo',
        mataPelajaran: b.mataPelajaran,
        persentaseOwner: b.persentaseOwner,
        persentaseGuru: b.persentaseGuru,
      },
    })
    console.log(`Branch dibuat: ${guruList[b.guruIdx].name} → Sidoarjo (${b.mataPelajaran}, ${b.persentaseOwner}/${b.persentaseGuru})`)
  }

  for (const b of branchSurabaya) {
    const bt = await prisma.branchTeacher.create({
      data: {
        userId: guruList[b.guruIdx].id,
        cabangDaerah: 'Kota Surabaya, Jawa Timur',
        provinsi: 'Jawa Timur',
        kotaKabupaten: 'Kota Surabaya',
        mataPelajaran: b.mataPelajaran,
        persentaseOwner: b.persentaseOwner,
        persentaseGuru: b.persentaseGuru,
      },
    })
    console.log(`Branch dibuat: ${guruList[b.guruIdx].name} → Surabaya (${b.mataPelajaran}, ${b.persentaseOwner}/${b.persentaseGuru})`)
  }

  // === 6. ASSIGN SISWA KE CABANG ===
  // Siswa cabang Sidoarjo
  const siswaSidoarjo = siswaList.filter((s) => s.domisili === 'Sidoarjo')
  const btSidoarjo = await prisma.branchTeacher.findMany({
    where: { cabangDaerah: 'Kota Sidoarjo, Jawa Timur' },
  })

  for (const siswa of siswaSidoarjo) {
    // Assign ke guru pertama di cabang
    const bt = btSidoarjo[0]
    if (bt) {
      await prisma.student.update({
        where: { id: siswa.id },
        data: { cabangDaerah: 'Kota Sidoarjo, Jawa Timur' },
      })
      await prisma.branchTeacher.update({
        where: { id: bt.id },
        data: { student: { connect: { id: siswa.id } } },
      })
    }
  }

  // Siswa cabang Surabaya
  const siswaSurabaya = siswaList.filter((s) => s.domisili === 'Surabaya')
  const btSurabaya = await prisma.branchTeacher.findMany({
    where: { cabangDaerah: 'Kota Surabaya, Jawa Timur' },
  })

  for (const siswa of siswaSurabaya) {
    const bt = btSurabaya[0]
    if (bt) {
      await prisma.student.update({
        where: { id: siswa.id },
        data: { cabangDaerah: 'Kota Surabaya, Jawa Timur' },
      })
      await prisma.branchTeacher.update({
        where: { id: bt.id },
        data: { student: { connect: { id: siswa.id } } },
      })
    }
  }

  console.log('\n=================================')
  console.log('SEED SELESAI!')
  console.log('=================================')
  console.log(`Owner: ${owner.name} (${owner.phone})`)
  console.log(`Guru: ${guruList.length} orang`)
  console.log(`Siswa: ${siswaList.length} orang`)
  console.log(`Cabang: Sidoarjo (${branchSidoarjo.length} guru), Surabaya (${branchSurabaya.length} guru)`)
  console.log('=================================')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
