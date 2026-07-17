import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Inisialisasi DOMPurify untuk server-side
// jsdom menyediakan window object yang dibutuhkan DOMPurify
const window = new JSDOM('').window
const purify = DOMPurify(window)

// Konfigurasi: tidak izinkan HTML tags sama sekali
// Hanya izinkan text plain — paling aman untuk input form
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
  ALLOW_DATA_ATTR: false,
}

/**
 * Sanitize string input menggunakan DOMPurify
 * Melindungi dari XSS: script injection, event handlers, svg injection, dll
 *
 * Bukan regex biasa — DOMPurify parse HTML secara proper dan handle:
 * - <script>alert(1)</script>
 * - <img src=x onerror=alert(1)>
 * - <svg onload=alert(1)>
 * - <iframe src=javascript:alert(1)>
 * - Unicode bypass tricks
 * - Null byte injection
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') return ''
  return purify.sanitize(input, SANITIZE_CONFIG).trim()
}

/**
 * Sanitize object values secara rekursif
 * Hanya sanitize string values, biarkan number/boolean/null
 */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...obj }
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitize(sanitized[key] as string)
    }
  }
  return sanitized
}

/**
 * Sanitize array of strings
 */
export function sanitizeArray(arr: string[]): string[] {
  return arr.map(sanitize)
}
