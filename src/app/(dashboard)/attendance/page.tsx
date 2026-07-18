'use client'

import { useState, useEffect } from 'react'

interface UserInfo {
  id: string
  name: string
  phone: string
  role: string
}

interface Student {
  id: string
  name: string
  ttl: string
  domisili: string
  asalSekolah: string
  cabangDaerah: string | null
}

const JENIS_PEMBELAJARAN = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS',
  'PPKN', 'Seni Budaya', 'Penjaskes', 'Prakarya', 'Komputer',
  'Bimbingan Belajar', 'Mengaji', 'Bahasa Arab', 'Tahfidz', 'Umum', 'Lainnya',
]

const LOKASI_MENGAJAR = [
  'Rumah Siswa', 'Rumah Tutor', 'Online (Zoom/Meet)', 'Tempat Les', 'Kantor', 'Lainnya',
]

const KELAS_MURID = [
  'Kelas 1 SD', 'Kelas 2 SD', 'Kelas 3 SD', 'Kelas 4 SD', 'Kelas 5 SD', 'Kelas 6 SD',
  'Kelas 7 SMP', 'Kelas 8 SMP', 'Kelas 9 SMP',
  'Kelas 10 SMA', 'Kelas 11 SMA', 'Kelas 12 SMA', 'Umum',
]

// Nomor WhatsApp Admin (Owner)
const ADMIN_WA = '6281234567890'

export default function AttendancePage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const [tanggalLes, setTanggalLes] = useState(new Date().toISOString().split('T')[0])
  const [jenisPembelajaran, setJenisPembelajaran] = useState('')
  const [lokasiMengajar, setLokasiMengajar] = useState('')
  const [kelasMurid, setKelasMurid] = useState('')
  const [catatanMateri, setCatatanMateri] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [namaWaliMurid, setNamaWaliMurid] = useState('')
  const [whatsappWaliMurid, setWhatsappWaliMurid] = useState('')

  useEffect(() => { fetchUser() }, [])
  useEffect(() => { if (user?.role === 'GURU') fetchStudents() }, [user])

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user || null)
    setLoading(false)
  }

  const fetchStudents = async () => {
    const res = await fetch('/api/students?status=APPROVED')
    const data = await res.json()
    setStudents(data.students || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    const selectedStudent = students.find((s) => s.id === selectedStudentId)
    const namaMurid = selectedStudent?.name || ''

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggalLes, jenisPembelajaran, lokasiMengajar, kelasMurid,
          jumlahMurid: 1,
          namaMurid, catatanMateri, fotoUrl, jamMulai, jamSelesai,
          namaWaliMurid, whatsappWaliMurid, studentId: selectedStudentId,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        // Format pesan WA
        const waMessage = encodeURIComponent(
          `📋 *Laporan Absensi Les*\n\n` +
          `📅 Tanggal: ${tanggalLes}\n` +
          `👤 Tutor: ${user?.name}\n` +
          `📱 WA Tutor: ${user?.phone}\n` +
          `📚 Mata Pelajaran: ${jenisPembelajaran}\n` +
          `📍 Lokasi: ${lokasiMengajar}\n` +
          `🏫 Kelas: ${kelasMurid}\n` +
          `👨‍🎓 Murid: ${namaMurid}\n` +
          `🕐 Jam: ${jamMulai} - ${jamSelesai}\n` +
          `📝 Materi: ${catatanMateri}\n` +
          `👨‍👩‍👦 Wali: ${namaWaliMurid}\n` +
          `${whatsappWaliMurid ? `📱 WA Wali: ${whatsappWaliMurid}` : ''}`
        )
        // Redirect ke WhatsApp admin
        window.open(`https://wa.me/${ADMIN_WA}?text=${waMessage}`, '_blank')

        setMessage({ type: 'success', text: 'Absensi berhasil disimpan! Silakan kirim laporan ke admin via WhatsApp.' })
        // Reset form
        setSelectedStudentId('')
        setTanggalLes(new Date().toISOString().split('T')[0])
        setJenisPembelajaran(''); setLokasiMengajar(''); setKelasMurid('')
        setCatatanMateri(''); setFotoUrl(''); setJamMulai(''); setJamSelesai('')
        setNamaWaliMurid(''); setWhatsappWaliMurid('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan data' })
      }
    } catch { setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan' }) }
    setSaving(false)
  }

  if (loading) {
    return <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400 text-sm">Loading...</div>
  }

  if (user?.role === 'ORANG_TUA') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Input Absensi Les</h1>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-600 text-sm">Orang tua tidak dapat menginput absensi les. Silakan melihat laporan di halaman Laporan.</p>
        </div>
      </div>
    )
  }

  if (user?.role === 'OWNER') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Input Absensi Les</h1>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-600 text-sm">Owner tidak menginput absensi les. Silakan melihat rekap di halaman Laporan.</p>
        </div>
      </div>
    )
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all text-sm"
  const selectClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all text-sm"

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Input Absensi Les</h1>
        <p className="text-sm text-gray-500 mt-1">Isi form berikut untuk mencatat aktivitas les</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-6 text-sm">
        <strong>Perhatian:</strong> Jika terjadi kendala, harap segera konfirmasi ke admin dan catat manual.
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Les <span className="text-red-500">*</span></label>
              <input type="date" value={tanggalLes} onChange={(e) => setTanggalLes(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jam Mulai <span className="text-red-500">*</span></label>
              <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jam Selesai <span className="text-red-500">*</span></label>
              <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Tutor <span className="text-red-500">*</span></label>
              <input type="text" value={user?.name || ''} readOnly className={inputClass.replace('bg-white', 'bg-gray-50')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Tutor <span className="text-red-500">*</span></label>
              <input type="text" value={user?.phone || ''} readOnly className={inputClass.replace('bg-white', 'bg-gray-50')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Pembelajaran <span className="text-red-500">*</span></label>
              <select value={jenisPembelajaran} onChange={(e) => setJenisPembelajaran(e.target.value)} required className={selectClass}>
                <option value="">Pilih Jenis Pembelajaran</option>
                {JENIS_PEMBELAJARAN.map((j) => (<option key={j} value={j}>{j}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi Mengajar <span className="text-red-500">*</span></label>
              <select value={lokasiMengajar} onChange={(e) => setLokasiMengajar(e.target.value)} required className={selectClass}>
                <option value="">Pilih Lokasi Mengajar</option>
                {LOKASI_MENGAJAR.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kelas Murid <span className="text-red-500">*</span></label>
              <select value={kelasMurid} onChange={(e) => setKelasMurid(e.target.value)} required className={selectClass}>
                <option value="">Pilih Kelas Murid</option>
                {KELAS_MURID.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Murid <span className="text-red-500">*</span></label>
              <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} required className={selectClass}>
                <option value="">Pilih Murid yang Diajar</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.cabangDaerah || 'Belum ada cabang'}</option>
                ))}
              </select>
              {students.length === 0 && <p className="text-xs text-gray-400 mt-1">Belum ada murid yang ditugaskan</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan / Materi <span className="text-red-500">*</span></label>
            <textarea value={catatanMateri} onChange={(e) => setCatatanMateri(e.target.value)} required rows={4}
              placeholder="Jelaskan materi yang diajarkan dan catatan perkembangan murid."
              className={inputClass + ' resize-none'} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Foto</label>
            <input type="text" value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="URL atau nama file foto (opsional)" className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Wali Murid <span className="text-red-500">*</span></label>
              <input type="text" value={namaWaliMurid} onChange={(e) => setNamaWaliMurid(e.target.value)} required
                placeholder="Nama lengkap wali murid" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Wali Murid</label>
              <input type="text" value={whatsappWaliMurid} onChange={(e) => setWhatsappWaliMurid(e.target.value)}
                placeholder="Nomor WhatsApp wali murid (opsional)" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors">
            {saving ? 'Menyimpan...' : 'Submit'}
          </button>
          <a href="/reports"
            className="bg-white text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-center border border-gray-200 transition-colors">
            Lihat Rekap Absensi
          </a>
        </div>
      </form>
    </div>
  )
}
