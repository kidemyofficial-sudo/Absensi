import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File gambar tidak ditemukan' }, { status: 400 })
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 })
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran foto maksimal 10MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Strategy 1: Try Catbox.moe (Provides permanent direct image URLs)
    try {
      const catboxForm = new FormData()
      catboxForm.append('reqtype', 'fileupload')
      catboxForm.append('fileToUpload', new Blob([buffer], { type: file.type }), file.name || 'image.jpg')

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: catboxForm,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      })

      if (catboxRes.ok) {
        const catboxUrl = (await catboxRes.text()).trim()
        if (catboxUrl.startsWith('http://') || catboxUrl.startsWith('https://')) {
          return NextResponse.json({ url: catboxUrl })
        }
      }
    } catch (err) {
      console.warn('Catbox upload failed, trying fallback:', err)
    }

    // Strategy 2: Fallback to tmpfiles.org
    try {
      const tmpForm = new FormData()
      tmpForm.append('file', new Blob([buffer], { type: file.type }), file.name || 'image.jpg')

      const tmpRes = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: tmpForm,
      })

      if (tmpRes.ok) {
        const tmpData = await tmpRes.json()
        const rawUrl = tmpData.data?.url
        if (rawUrl) {
          const directUrl = rawUrl.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/')
          return NextResponse.json({ url: directUrl })
        }
      }
    } catch (err) {
      console.warn('Tmpfiles upload failed:', err)
    }

    return NextResponse.json(
      { error: 'Gagal mengunggah foto ke server. Silakan coba lagi.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Upload endpoint error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server saat mengunggah foto' },
      { status: 500 }
    )
  }
}
