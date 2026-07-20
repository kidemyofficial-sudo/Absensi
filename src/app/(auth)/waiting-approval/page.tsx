import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import WaitingApprovalClient from '@/components/WaitingApprovalClient'

export const metadata = {
  title: 'Menunggu Persetujuan',
  description: 'Akun Anda sedang menunggu persetujuan dari Admin/Owner.',
}

export default async function WaitingApprovalPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.status === 'APPROVED') {
    redirect('/dashboard')
  }

  // Fetch owner's phone number dynamically
  const owner = await prisma.user.findFirst({
    where: { role: 'OWNER' },
    select: { phone: true },
  })

  const ownerPhone = owner?.phone || '081234567890'

  // Format to standard WhatsApp format (replace leading 0 with 62)
  let cleanPhone = ownerPhone.replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1)
  }

  const roleText = user.role === 'GURU' ? 'Guru' : 'Wali Murid'
  const waMessage = encodeURIComponent(
    `Halo Admin, saya sudah mendaftar akun di Sistem Absensi Kidemy sebagai ${roleText} dengan nama ${user.name} (no. telp: ${user.phone}). Mohon bantuannya untuk menyetujui akun saya. Terima kasih!`
  )
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`

  return (
    <WaitingApprovalClient
      userName={user.name}
      roleText={roleText}
      waUrl={waUrl}
    />
  )
}
