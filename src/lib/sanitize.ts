/**
 * Sanitize string input untuk mencegah XSS
 * Server-side implementation tanpa DOMPurify dependency
 */

// Regex-based sanitization untuk server-side
const HTML_TAG_REGEX = /<[^>]*>/g
const HTML_ENTITY_REGEX = /[&<>"']/g

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

/**
 * Sanitize string input untuk mencegah XSS
 * Menghapus semua HTML tags dan escape special characters
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    .replace(HTML_TAG_REGEX, '') // Hapus semua HTML tags
    .replace(HTML_ENTITY_REGEX, (char) => HTML_ENTITIES[char] || char) // Escape special chars
    .trim()
}

/**
 * Sanitize object values secara rekursif
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
