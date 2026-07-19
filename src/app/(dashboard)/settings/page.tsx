import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileForm from '@/components/ProfileForm'
import PasswordForm from '@/components/PasswordForm'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) return null

  let userData: { id: string; name: string; phone: string; role: string } | null = null

  try {
    userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, phone: true, role: true },
    })
  } catch (err) {
    console.error("Prisma error in settings page findUnique:", err)
  }

  const fallbackUser = {
    id: user.id,
    name: user.name,
    phone: '',
    role: user.role,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola profil dan pengaturan akun Anda</p>
      </div>

      <div className="space-y-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Profil Saya</h3>
              <p className="text-xs text-gray-500">Update informasi profil Anda</p>
            </div>
          </div>
          <ProfileForm user={userData || fallbackUser} />
        </div>


        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Ubah Password</h3>
              <p className="text-xs text-gray-500">Perbarui password akun Anda</p>
            </div>
          </div>
          <PasswordForm />
        </div>
      </div>
    </div>
  )
}
