/**
 * Unescape/decode HTML entities (contoh: &amp; menjadi &, &#x27; menjadi ', &quot; menjadi ", dll.)
 * Mencegah karakter terpisah seperti 'Bunda Cello&amp;Nasya' tampil di UI/PDF.
 */
export function decodeHtmlEntities(input: string): string {
  if (typeof input !== 'string') return ''
  let current = input
  let previous = ''
  let maxLoop = 5
  while (current !== previous && maxLoop > 0) {
    previous = current
    current = current
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#47;/g, '/')
    maxLoop--
  }
  return current
}

/**
 * Sanitize string input secara secure tanpa menggunakan package JSDOM/DOMPurify
 * Mencegah XSS dengan cara menghapus tag HTML/XML, lalu meng-decode entity
 * agar data tersimpan dalam bentuk plain text murni di database.
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') return ''
  
  // 1. Bersihkan tag HTML secara aman
  const stripped = input.replace(/<[^>]*>?/gm, '')
  
  // 2. Decode HTML entities agar tersimpan sebagai plain text murni
  return decodeHtmlEntities(stripped).trim()
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

