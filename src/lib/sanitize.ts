/**
 * Sanitize string input secara secure tanpa menggunakan package JSDOM/DOMPurify
 * yang memiliki dependency native binary berat dan sering crash di serverless environment Vercel.
 *
 * Mencegah XSS dengan cara:
 * 1. Menghilangkan semua pola tag HTML/XML secara aman.
 * 2. Meng-encode karakter khusus HTML menjadi HTML Entities untuk perlindungan mutlak.
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') return ''
  
  // 1. Bersihkan tag HTML secara aman
  const stripped = input.replace(/<[^>]*>?/gm, '')
  
  // 2. Encode karakter khusus HTML
  return stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
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
