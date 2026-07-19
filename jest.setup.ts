import '@testing-library/jest-dom'
import fs from 'fs'
import path from 'path'

// Polyfill TextEncoder and TextDecoder for Jest
class TextEncoderPolyfill {
  encode(str: string): Uint8Array {
    const arr = new Uint8Array(str.length * 3)
    let actualLen = 0
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
      if (code < 0x80) {
        arr[actualLen++] = code
      } else if (code < 0x800) {
        arr[actualLen++] = 0xc0 | (code >> 6)
        arr[actualLen++] = 0x80 | (code & 0x3f)
      } else {
        arr[actualLen++] = 0xe0 | (code >> 12)
        arr[actualLen++] = 0x80 | ((code >> 6) & 0x3f)
        arr[actualLen++] = 0x80 | (code & 0x3f)
      }
    }
    return arr.slice(0, actualLen)
  }
}

// @ts-expect-error - TextEncoder polyfill for Jest
global.TextEncoder = TextEncoderPolyfill

// @ts-expect-error - TextDecoder polyfill for Jest
global.TextDecoder = class TextDecoder {
  decode(buf: Uint8Array): string {
    let str = ''
    for (let i = 0; i < buf.length; i++) {
      str += String.fromCharCode(buf[i])
    }
    return str
  }
}

// Set env vars for tests
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    if (process.env[key]) continue

    let value = trimmed.slice(equalsIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

process.env.JWT_SECRET = 'test-secret-key-for-jest'
