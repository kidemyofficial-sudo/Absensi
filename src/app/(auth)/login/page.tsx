'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PasswordVisibilityToggle from '@/components/PasswordVisibilityToggle'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Login gagal')
      router.push(from)
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
        <h2 className="text-xl font-bold mb-1" style={{ color: '#1e1b4b' }}>Selamat Datang 👋</h2>
        <p className="text-sm" style={{ color: '#6b7280' }}>Masuk ke akun Kidemy Anda</p>
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
              required
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              labelVisible="Sembunyikan password"
              labelHidden="Tampilkan password"
            />
          </div>
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
              Masuk...
            </span>
          ) : 'Masuk'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(229,231,235,0.6)' }} />
          <span className="text-xs" style={{ color: '#9ca3af' }}>atau</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(229,231,235,0.6)' }} />
        </div>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold" style={{ color: '#6366f1' }}>
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-sm" style={{ color: '#9ca3af' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
