import '@testing-library/jest-dom'

// Polyfill TextEncoder and TextDecoder for Jest
class TextEncoderPolyfill {
  encode(str: string): Uint8Array {
    const arr = new Uint8Array(str.length * 3)
    let actualLen = 0
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i)
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
process.env.JWT_SECRET = 'test-secret-key-for-jest'
