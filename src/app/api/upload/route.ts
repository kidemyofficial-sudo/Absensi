import { NextResponse } from 'next/server'

// Image upload API is deprecated since images are shared directly via Web Share API
// without saving on any server or database.
export async function POST() {
  return NextResponse.json(
    { error: 'Upload gambar ke server tidak lagi digunakan. Gambar dikirim langsung bersama pesan WhatsApp.' },
    { status: 410 }
  )
}
