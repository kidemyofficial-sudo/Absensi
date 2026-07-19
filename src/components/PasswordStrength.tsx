'use client'

interface PasswordStrengthProps {
  password: string
  className?: string
}

function getStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }

  const score = Object.values(checks).filter(Boolean).length

  if (!password) {
    return { label: 'Belum diisi', color: 'bg-gray-200', width: '0%', checks }
  }

  if (score <= 2) return { label: 'Lemah', color: 'bg-red-500', width: '25%', checks }
  if (score === 3) return { label: 'Sedang', color: 'bg-yellow-500', width: '50%', checks }
  if (score === 4) return { label: 'Kuat', color: 'bg-blue-500', width: '75%', checks }
  return { label: 'Sangat kuat', color: 'bg-green-500', width: '100%', checks }
}

function CheckMark({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-3 w-3">
        <path
          d="M3.5 8.5L6.5 11.5L12.5 4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-1.5 w-1.5">
      <circle cx="8" cy="8" r="2" />
    </svg>
  )
}

function CheckItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? 'text-green-700' : 'text-gray-500'}`}>
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
          ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
        }`}
        aria-hidden="true"
      >
        <CheckMark ok={ok} />
      </span>
      <span>{children}</span>
    </li>
  )
}

export default function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
  const strength = getStrength(password)
  const hasInput = password.length > 0

  const labelClass = !password
    ? 'text-gray-400'
    : strength.label === 'Lemah'
      ? 'text-red-600'
      : strength.label === 'Sedang'
        ? 'text-yellow-600'
        : strength.label === 'Kuat'
          ? 'text-blue-600'
          : 'text-green-600'

  return (
    <div className={className} aria-live="polite">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-500">Syarat password</span>
        <span className={`font-medium ${labelClass}`}>{strength.label}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${strength.color}`} style={{ width: strength.width }} />
      </div>
      <div
        className={`grid overflow-hidden transition-all duration-200 ease-out ${
          hasInput ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <ul className="min-h-0 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
          <CheckItem ok={strength.checks.length}>Minimal 8 karakter</CheckItem>
          <CheckItem ok={strength.checks.lower}>Huruf kecil</CheckItem>
          <CheckItem ok={strength.checks.upper}>Huruf besar</CheckItem>
          <CheckItem ok={strength.checks.number}>Angka</CheckItem>
          <CheckItem ok={strength.checks.symbol}>Simbol</CheckItem>
        </ul>
      </div>
    </div>
  )
}
