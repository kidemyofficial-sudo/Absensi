'use client'

import { useState } from 'react'
import PasswordVisibilityToggle from '@/components/PasswordVisibilityToggle'
import PasswordStrength from '@/components/PasswordStrength'

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (newPassword !== confirmPassword) {
      setMessage('Password baru tidak cocok')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setMessage('Password baru minimal 8 karakter')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal ubah password')
      setMessage('Password berhasil diubah!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = message.includes('berhasil')

  return (
    <>
      {message && (
        <div
          className="mb-4 p-3.5 rounded-xl text-sm font-medium"
          style={{
            background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: isSuccess ? '#065f46' : '#991b1b',
            border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Password Saat Ini</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="glass-input pr-12"
              />
              <PasswordVisibilityToggle
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((prev) => !prev)}
                labelVisible="Sembunyikan password saat ini"
                labelHidden="Tampilkan password saat ini"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Password Baru</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="glass-input pr-12"
              />
              <PasswordVisibilityToggle
                visible={showNewPassword}
                onToggle={() => setShowNewPassword((prev) => !prev)}
                labelVisible="Sembunyikan password baru"
                labelHidden="Tampilkan password baru"
              />
            </div>
            <PasswordStrength password={newPassword} className="mt-3" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="glass-input pr-12"
              />
              <PasswordVisibilityToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
                labelVisible="Sembunyikan konfirmasi password"
                labelHidden="Tampilkan konfirmasi password"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </div>
      </form>
    </>
  )
}
