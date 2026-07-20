'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PasswordVisibilityToggle from '@/components/PasswordVisibilityToggle'
import PasswordStrength from '@/components/PasswordStrength'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'GURU' | 'ORANG_TUA'>('GURU')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, role }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Registrasi gagal')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-1" style={{ color: '#1e1b4b' }}>Daftar Akun Baru 👋</h2>
        <p className="text-sm" style={{ color: '#6b7280' }}>Bergabunglah dengan platform Kidemy</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl text-sm font-medium" style={{
          background: 'rgba(239,68,68,0.08)',
          color: '#991b1b',
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
            Nama Lengkap
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
            Nomor Telepon
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="glass-input"
            placeholder="08xxxxxxxxxx"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input pr-12"
              minLength={8}
              required
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              labelVisible="Sembunyikan password"
              labelHidden="Tampilkan password"
            />
          </div>
          <PasswordStrength password={password} className="mt-3" />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
            Daftar sebagai
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'GURU' | 'ORANG_TUA')}
            className="glass-input"
          >
            <option value="GURU">Guru</option>
            <option value="ORANG_TUA">Orang Tua</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2"
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mendaftar...
            </span>
          ) : 'Daftar'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(229,231,235,0.6)' }} />
          <span className="text-xs" style={{ color: '#9ca3af' }}>atau</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(229,231,235,0.6)' }} />
        </div>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold" style={{ color: '#6366f1' }}>
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
