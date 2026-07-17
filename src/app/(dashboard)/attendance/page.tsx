'use client'

import { useState, useEffect } from 'react'

interface UserInfo {
  id: string
  name: string
  phone: string
  role: string
}

const JENIS_PEMBELAJARAN = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'IPA',
  'IPS',
  'PPKN',
  'Seni Budaya',
  'Penjaskes',
  'Prakarya',
  'Komputer',
  'Bimbingan Belajar',
  'Mengaji',
  'Bahasa Arab',
  'Tahfidz',
  'Lainnya',
]

const LOKASI_MENGAJAR = [
  'Rumah Siswa',
  'Rumah Tutor',
  'Online (Zoom/Meet)',
  'Tempat Les',
  'Kantor',
  'Lainnya',
]

const KELAS_MURID = [
  'Kelas 1 SD',
  'Kelas 2 SD',
  'Kelas 3 SD',
  'Kelas 4 SD',
  'Kelas 5 SD',
  'Kelas 6 SD',
  'Kelas 7 SMP',
  'Kelas 8 SMP',
  'Kelas 9 SMP',
  'Kelas 10 SMA',
  'Kelas 11 SMA',
  'Kelas 12 SMA',
  'Umum',
]

const JUMLAH_MURID = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']

export default function AttendancePage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [tanggalLes, setTanggalLes] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [jenisPembelajaran, setJenisPembelajaran] = useState('')
  const [lokasiMengajar, setLokasiMengajar] = useState('')
  const [kelasMurid, setKelasMurid] = useState('')
  const [jumlahMurid, setJumlahMurid] = useState('')
  const [namaMurid, setNamaMurid] = useState('')
  const [catatanMateri, setCatatanMateri] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [namaWaliMurid, setNamaWaliMurid] = useState('')
  const [whatsappWaliMurid, setWhatsappWaliMurid] = useState('')

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user || null)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggalLes,
          jenisPembelajaran,
          lokasiMengajar,
          kelasMurid,
          jumlahMurid,
          namaMurid,
          catatanMateri,
          fotoUrl,
          jamMulai,
          jamSelesai,
          namaWaliMurid,
          whatsappWaliMurid,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Data les berhasil disimpan!' })
        // Reset form
        setTanggalLes(new Date().toISOString().split('T')[0])
        setJenisPembelajaran('')
        setLokasiMengajar('')
        setKelasMurid('')
        setJumlahMurid('')
        setNamaMurid('')
        setCatatanMateri('')
        setFotoUrl('')
        setJamMulai('')
        setJamSelesai('')
        setNamaWaliMurid('')
        setWhatsappWaliMurid('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan data' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan' })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
        Loading...
      </div>
    )
  }

  if (user?.role === 'ORANG_TUA') {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Input Absensi Les</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-gray-600">
            Orang tua tidak dapat menginput absensi les. Silakan melihat laporan di halaman Laporan.
          </p>
        </div>
      </div>
    )
  }

  if (user?.role === 'OWNER') {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Input Absensi Les</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-gray-600">
            Owner tidak menginput absensi les. Silakan melihat rekap di halaman Laporan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Input Absensi Les</h2>

      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
        <strong>Perhatian:</strong> Jika terjadi kendala, harap segera konfirmasi ke admin dan catat manual.
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          {/* Row 1: Tanggal Les + Jam Mulai + Jam Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tanggal Les <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalLes}
                onChange={(e) => setTanggalLes(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Row 2: Nama Tutor + WhatsApp Tutor (read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nama Lengkap Tutor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={user?.name || ''}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Nomor WhatsApp Tutor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={user?.phone || ''}
                readOnly
                className="w-full px-3 py-2 border rounded-md bg-gray-50"
              />
            </div>
          </div>

          {/* Row 3: Jenis Pembelajaran + Lokasi Mengajar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Jenis Pembelajaran <span className="text-red-500">*</span>
              </label>
              <select
                value={jenisPembelajaran}
                onChange={(e) => setJenisPembelajaran(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Pilih Jenis Pembelajaran</option>
                {JENIS_PEMBELAJARAN.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Lokasi Mengajar <span className="text-red-500">*</span>
              </label>
              <select
                value={lokasiMengajar}
                onChange={(e) => setLokasiMengajar(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Pilih Lokasi Mengajar</option>
                {LOKASI_MENGAJAR.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Kelas Murid + Jumlah Murid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Kelas Murid <span className="text-red-500">*</span>
              </label>
              <select
                value={kelasMurid}
                onChange={(e) => setKelasMurid(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Pilih Kelas Murid</option>
                {KELAS_MURID.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Jumlah Murid <span className="text-red-500">*</span>
              </label>
              <select
                value={jumlahMurid}
                onChange={(e) => setJumlahMurid(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Pilih Jumlah Murid</option>
                {JUMLAH_MURID.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Nama Murid */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nama Lengkap Murid yang Diajar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={namaMurid}
              onChange={(e) => setNamaMurid(e.target.value)}
              required
              placeholder="Contoh: Ahmad Rizki, Siti Aminah"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Row 6: Catatan / Materi */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Catatan / Materi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={catatanMateri}
              onChange={(e) => setCatatanMateri(e.target.value)}
              required
              rows={4}
              placeholder="Jelaskan materi yang diajarkan dan catatan perkembangan murid."
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Row 7: Upload Foto */}
          <div>
            <label className="block text-sm font-medium mb-1">Upload Foto</label>
            <input
              type="text"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="URL atau nama file foto (opsional)"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Row 8: Nama Wali Murid + WhatsApp Wali Murid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nama Lengkap Wali Murid <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={namaWaliMurid}
                onChange={(e) => setNamaWaliMurid(e.target.value)}
                required
                placeholder="Nama lengkap wali murid"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nomor WhatsApp Wali Murid</label>
              <input
                type="text"
                value={whatsappWaliMurid}
                onChange={(e) => setWhatsappWaliMurid(e.target.value)}
                placeholder="Nomor WhatsApp wali murid (opsional)"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Menyimpan...' : 'Submit'}
          </button>
          <a
            href="/reports"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 font-medium text-center"
          >
            Lihat Rekap Absensi
          </a>
        </div>
      </form>
    </div>
  )
}
