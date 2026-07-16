import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileForm from '@/components/ProfileForm'
import PasswordForm from '@/components/PasswordForm'
import TeacherManagement from '@/components/TeacherManagement'
import ClassManagement from '@/components/ClassManagement'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) return null

  // Get full user data
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pengaturan Akun</h2>

      {/* Profile Settings - Semua Role */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profil Saya</h3>
        <ProfileForm user={userData!} />
      </div>

      {/* Password Settings - Semua Role */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ubah Password</h3>
        <PasswordForm />
      </div>

      {/* Teacher Management - Owner Only */}
      {user.role === 'OWNER' && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border-2 border-blue-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kelola Guru</h3>
          <TeacherManagement />
        </div>
      )}

      {/* Class Management - Owner Only */}
      {user.role === 'OWNER' && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border-2 border-green-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kelola Kelas & Guru Pengampu</h3>
          <ClassManagement />
        </div>
      )}
    </div>
  )
}
