import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const ownerEmail = 'kidemyofficial@gmail.com'
  const ownerPassword = 'admin123456'

  // Check if owner already exists
  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  })

  if (existingOwner) {
    console.log('Owner sudah exists:', ownerEmail)
    return
  }

  // Create owner account
  const hashedPassword = await bcrypt.hash(ownerPassword, 12)
  const owner = await prisma.user.create({
    data: {
      name: 'Owner/Admin',
      email: ownerEmail,
      password: hashedPassword,
      role: 'OWNER',
    },
  })

  console.log('Owner account created:')
  console.log('  Email:', owner.email)
  console.log('  Password:', ownerPassword)
  console.log('  Role:', owner.role)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
