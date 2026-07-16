import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Reset all data
  console.log('Menghapus semua data...')
  await prisma.attendance.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.student.deleteMany()
  await prisma.classroomTeacher.deleteMany()
  await prisma.user.deleteMany()
  console.log('Semua data berhasil dihapus.')

  // Create owner account
  const ownerPhone = '081234567890'
  const ownerPassword = 'admin123456'

  const hashedPassword = await bcrypt.hash(ownerPassword, 12)
  const owner = await prisma.user.create({
    data: {
      name: 'Owner/Admin',
      phone: ownerPhone,
      password: hashedPassword,
      role: 'OWNER',
    },
  })

  console.log('')
  console.log('=================================')
  console.log('AKUN OWNER BERHASIL DIBUAT:')
  console.log('=================================')
  console.log('Telepon:', ownerPhone)
  console.log('Password:', ownerPassword)
  console.log('Role:', owner.role)
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
