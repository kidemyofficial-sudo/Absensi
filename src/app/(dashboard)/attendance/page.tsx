'use client'

import { useState, useEffect } from 'react'
import { LESSON_LOCATIONS, MIN_CATATAN_MATERI_LENGTH } from '@/lib/lesson-options'

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
  parent?: {
    id: string
    name: string
    phone: string
  }
}

const JENIS_PEMBELAJARAN = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS',
  'PPKN', 'Seni Budaya', 'Penjaskes', 'Prakarya', 'Komputer',
  'Bimbingan Belajar', 'Mengaji', 'Bahasa Arab', 'Tahfidz', 'Umum', 'Lainnya',
]

const KELAS_MURID = [
  'Kelas 1 SD', 'Kelas 2 SD', 'Kelas 3 SD', 'Kelas 4 SD', 'Kelas 5 SD', 'Kelas 6 SD',
  'Kelas 7 SMP', 'Kelas 8 SMP', 'Kelas 9 SMP',
  'Kelas 10 SMA', 'Kelas 11 SMA', 'Kelas 12 SMA', 'Umum',
]

// Nomor WhatsApp Admin (Owner)
const ADMIN_WA = '628817019539'

// Helper format WA number
const formatWhatsAppNumber = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  }
  return cleaned
}

export default function AttendancePage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedLinks, setSubmittedLinks] = useState<{ admin: string } | null>(null)

  const [tanggalLes, setTanggalLes] = useState(new Date().toISOString().split('T')[0])
  const [jenisPembelajaran, setJenisPembelajaran] = useState('')
  const [jenisLainnya, setJenisLainnya] = useState('')
  const [lokasiMengajar, setLokasiMengajar] = useState('')
  const [kelasMurid, setKelasMurid] = useState('')
  const [catatanMateri, setCatatanMateri] = useState('')
  const [kritikSaran, setKritikSaran] = useState('')
  
  // Custom Image Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [namaWaliMurid, setNamaWaliMurid] = useState('')
  const [whatsappWaliMurid, setWhatsappWaliMurid] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImagePreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
  }

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user || null)
      setLoading(false)
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (user?.role !== 'GURU') return

    const fetchStudents = async () => {
      // Fetch up to 50 students
      const res = await fetch('/api/students?status=APPROVED&limit=50')
      const data = await res.json()
      setStudents(data.students || [])
    }

    fetchStudents()
  }, [user?.role])

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    setSelectedStudentId(student.id)
    setNamaWaliMurid(student.parent?.name || '')
    setWhatsappWaliMurid(student.parent?.phone || '')
    setMessage({ type: '', text: '' })
  }

  const handleResetSelection = () => {
    setSelectedStudent(null)
    setSelectedStudentId('')
    setNamaWaliMurid('')
    setWhatsappWaliMurid('')
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    const resolvedJenisPembelajaran = jenisPembelajaran === 'Lainnya' ? jenisLainnya.trim() : jenisPembelajaran.trim()
    const trimmedCatatanMateri = catatanMateri.trim()
    const trimmedKritikSaran = kritikSaran.trim()
    const trimmedNamaWaliMurid = namaWaliMurid.trim()
    const trimmedWhatsappWaliMurid = whatsappWaliMurid.trim()

    if (!selectedStudent) {
      setMessage({ type: 'error', text: 'Pilih murid yang diajar terlebih dahulu' })
      setSaving(false)
      return
    }

    if (!resolvedJenisPembelajaran) {
      setMessage({ type: 'error', text: 'Tulis nama mata pelajaran jika memilih Lainnya' })
      setSaving(false)
      return
    }

    if (trimmedCatatanMateri.length < MIN_CATATAN_MATERI_LENGTH) {
      setMessage({ type: 'error', text: 'Catatan terlalu singkat, jelaskan aktivitas dan materi lebih detail' })
      setSaving(false)
      return
    }

    const namaMurid = selectedStudent.name

    // Format tanggal Indonesia
    const tglFormatted = new Date(tanggalLes + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    // Simpan data les ke database (foto tidak disimpan di server)
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggalLes, jenisPembelajaran: resolvedJenisPembelajaran, lokasiMengajar, kelasMurid,
          jumlahMurid: 1,
          namaMurid, catatanMateri: trimmedCatatanMateri, kritikSaran: trimmedKritikSaran || null,
          fotoUrl: null, // Foto dikirim langsung via WA, tidak disimpan di sistem
          jamMulai, jamSelesai,
          namaWaliMurid: trimmedNamaWaliMurid, whatsappWaliMurid: trimmedWhatsappWaliMurid || null,
          studentId: selectedStudentId,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        // === FORMAT PESAN WA PROFESIONAL ===
        const separator = '━━━━━━━━━━━━━━━━━━━━'
        const waText =
          `*LAPORAN ABSENSI LES*\n` +
          `*Kidemy Education*\n` +
          `${separator}\n\n` +
          `📅 *Tanggal:* ${tglFormatted}\n` +
          `🕐 *Jam:* ${jamMulai} - ${jamSelesai}\n\n` +
          `${separator}\n` +
          `*📚 DETAIL LES*\n` +
          `${separator}\n` +
          `• Mata Pelajaran : ${resolvedJenisPembelajaran}\n` +
          `• Lokasi         : ${lokasiMengajar}\n` +
          `• Kelas          : ${kelasMurid}\n\n` +
          `${separator}\n` +
          `*👨‍🎓 DATA MURID*\n` +
          `${separator}\n` +
          `• Nama           : ${namaMurid}\n` +
          `• Wali Murid     : ${trimmedNamaWaliMurid}\n` +
          (trimmedWhatsappWaliMurid ? `• No. WA Wali    : ${trimmedWhatsappWaliMurid}\n` : '') +
          `\n${separator}\n` +
          `*👨‍🏫 DATA TUTOR*\n` +
          `${separator}\n` +
          `• Nama           : ${user?.name}\n` +
          `• No. WA         : ${user?.phone}\n\n` +
          `${separator}\n` +
          `*📝 CATATAN MATERI*\n` +
          `${separator}\n` +
          `${trimmedCatatanMateri}\n` +
          (trimmedKritikSaran
            ? `\n${separator}\n` +
              `*💡 PERKEMBANGAN & KENDALA*\n` +
              `${separator}\n` +
              `${trimmedKritikSaran}\n`
            : '') +
          `\n${separator}\n` +
          `_Dikirim via Sistem Absensi Kidemy_` +
          (selectedFile ? `\n_📸 Foto kegiatan terlampir_` : '')

        const cleanAdminPhone = formatWhatsAppNumber(ADMIN_WA)
        const adminLink = `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(waText)}`
        setSubmittedLinks({ admin: adminLink })
        setMessage({ type: 'success', text: 'Absensi berhasil disimpan!' })

        // Kirim langsung via native share (membawa foto) jika didukung browser/HP
        const canNativeShare = !!selectedFile &&
          typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [selectedFile] })

        if (canNativeShare && selectedFile) {
          try {
            await navigator.share({ text: waText, files: [selectedFile] })
          } catch (shareErr) {
            // AbortError = user cancelled share sheet — no fallback needed
            if ((shareErr as Error).name !== 'AbortError') {
              window.open(adminLink, '_blank')
            }
          }
        } else {
          // Desktop / browser tidak support share file → buka wa.me biasa
          window.open(adminLink, '_blank')
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan data' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan' })
    }
    setSaving(false)
  }

  const handleResetForm = () => {
    setSelectedStudent(null)
    setSelectedStudentId('')
    setSubmittedLinks(null)
    setMessage({ type: '', text: '' })
    setTanggalLes(new Date().toISOString().split('T')[0])
    setJenisPembelajaran('')
    setJenisLainnya('')
    setLokasiMengajar('')
    setKelasMurid('')
    setCatatanMateri('')
    setKritikSaran('')
    setSelectedFile(null)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
    setJamMulai('')
    setJamSelesai('')
    setNamaWaliMurid('')
    setWhatsappWaliMurid('')
  }

  if (loading) {
    return <div className="glass-card p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>
  }

  if (user?.role === 'ORANG_TUA') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1e1b4b' }}>Input Absensi Les</h1>
        <div className="glass-card p-6">
          <p className="text-sm" style={{ color: '#6b7280' }}>Orang tua tidak dapat menginput absensi les. Silakan melihat laporan di halaman Laporan.</p>
        </div>
      </div>
    )
  }

  if (user?.role === 'OWNER') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1e1b4b' }}>Input Absensi Les</h1>
        <div className="glass-card p-6">
          <p className="text-sm" style={{ color: '#6b7280' }}>Owner tidak menginput absensi les. Silakan melihat rekap di halaman Laporan.</p>
        </div>
      </div>
    )
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const inputClass = "glass-input text-sm"
  const selectClass = "glass-input text-sm"

  return (
    <div className="max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Input Absensi Les</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Cari murid lalu isi laporan aktivitas les harian</p>
      </div>

      {/* STATE 3: HALAMAN SUKSES */}
      {submittedLinks ? (
        <div className="glass-card p-8 text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
            <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Absensi Berhasil Disimpan!</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#6b7280' }}>
              Laporan absensi untuk <strong style={{ color: '#374151' }}>{selectedStudent?.name}</strong> telah tercatat.
              Laporan dikirim ke Admin dengan format profesional.
            </p>
          </div>

          {imagePreviewUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreviewUrl} alt="Foto Kegiatan" className="w-full max-h-40 object-cover" />
              <p className="text-[10px] text-gray-400 py-1.5 px-3 text-left bg-gray-50">
                📸 Foto dikirim langsung bersama pesan WA — tidak disimpan di sistem
              </p>
            </div>
          )}

          <div className="px-4 py-3 rounded-xl text-xs text-left" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#92400e' }}>
            <strong>Catatan:</strong> Jika WhatsApp tidak terbuka otomatis, klik tombol di bawah untuk kirim manual. Foto akan terlampir di WhatsApp langsung dari galeri Anda.
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={submittedLinks.admin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3 text-white rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.35)' }}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.18 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.64 1.97 14.185.94 11.553.94c-5.445 0-9.87 4.37-9.874 9.8.001 2.07.545 4.093 1.58 5.864L2.247 20.8l4.4-1.646zm11.83-6.182c-.3-.149-1.774-.863-2.048-.962-.274-.1-.474-.149-.674.15-.2.299-.774.962-.948 1.16-.174.2-.299.3-.498.1-.2.05-.374-.025-.524-.075-.15-.674-1.603-.923-2.199-.243-.58-.49-.5-.674-.51-.174-.01-.374-.01-.573-.01-.2 0-.524.075-.798.374-.274.299-1.047 1.022-1.047 2.492 0 1.47 1.071 2.889 1.221 3.088.15.2 2.107 3.2 5.104 4.492.713.307 1.27.491 1.704.629.717.227 1.369.195 1.884.118.574-.085 1.774-.718 2.023-1.411.249-.693.249-1.289.174-1.411-.075-.122-.274-.199-.573-.348z"/>
              </svg>
              Kirim Laporan ke Admin (Kidemy)
            </a>
          </div>

          <button
            onClick={handleResetForm}
            className="btn-secondary w-full"
            style={{ padding: '0.65rem 1rem' }}
          >
            Kembali ke Daftar Murid
          </button>
        </div>
      ) : (
        <>
          {/* STATE 1: GURU PILIH MURID DULU */}
          {!selectedStudent ? (
            <div className="space-y-5">
              {/* Search Bar */}
              <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-96 relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center" style={{ color: '#9ca3af' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama murid..."
                    className="glass-input pl-10 text-sm"
                  />
                </div>
                <div className="text-xs font-medium" style={{ color: '#9ca3af' }}>
                  Total Murid: <span style={{ color: '#6366f1' }}>{students.length}</span>
                </div>
              </div>

              {/* Grid Murid */}
              {filteredStudents.length === 0 ? (
                <div className="glass-card p-12 text-center text-sm" style={{ color: '#9ca3af' }}>
                  {students.length === 0 
                    ? "Belum ada murid yang ditugaskan ke Anda. Silakan hubungi admin/owner."
                    : "Murid dengan nama tersebut tidak ditemukan."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents.map((student) => (
                    <div 
                      key={student.id} 
                      className="glass-card p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
                      style={{ borderLeft: '3px solid #6366f1' }}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm line-clamp-1" style={{ color: '#1e1b4b' }}>{student.name}</h3>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                              {student.cabangDaerah || 'Belum ada cabang'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(229,231,235,0.4)' }}>
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: '#9ca3af' }}>Wali:</span>
                            <span className="font-medium" style={{ color: '#374151' }}>{student.parent?.name || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: '#9ca3af' }}>WhatsApp:</span>
                            <span className="font-medium" style={{ color: '#374151' }}>{student.parent?.phone || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectStudent(student)}
                        className="btn-primary mt-4 w-full text-xs"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Pilih & Absen
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* STATE 2: FORMULIR ABSENSI SETELAH PILIH MURID */
            <div className="space-y-5">
              {/* Highlight Murid Terpilih */}
              <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ borderLeft: '3px solid #6366f1' }}>
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base" style={{ color: '#1e1b4b' }}>{selectedStudent.name}</h4>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                        {selectedStudent.cabangDaerah || 'Umum'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                      Wali: <strong style={{ color: '#374151' }}>{selectedStudent.parent?.name || '-'}</strong> | WA: <strong style={{ color: '#374151' }}>{selectedStudent.parent?.phone || '-'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetSelection}
                  className="btn-secondary text-xs self-start sm:self-auto"
                  style={{ padding: '0.45rem 0.85rem' }}
                >
                  Ganti Murid
                </button>
              </div>

              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#92400e' }}>
                <strong>Perhatian:</strong> Jika terjadi kendala, harap segera konfirmasi ke admin dan catat manual.
              </div>

              {message.text && (
                <div className="p-4 rounded-xl text-sm font-medium" style={{
                  background: message.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  color: message.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="glass-card p-6 space-y-5">
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
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4b5563' }}>Nama Tutor <span className="text-red-500">*</span></label>
                      <input type="text" value={user?.name || ''} readOnly className={inputClass} style={{ background: 'rgba(243,244,246,0.5)', cursor: 'not-allowed' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4b5563' }}>WhatsApp Tutor <span className="text-red-500">*</span></label>
                      <input type="text" value={user?.phone || ''} readOnly className={inputClass} style={{ background: 'rgba(243,244,246,0.5)', cursor: 'not-allowed' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4b5563' }}>Mata Pelajaran/Topik <span className="text-red-500">*</span></label>
                      <select value={jenisPembelajaran} onChange={(e) => { setJenisPembelajaran(e.target.value); if (e.target.value !== 'Lainnya') setJenisLainnya('') }} required className={selectClass}>
                        <option value="">Pilih Mata Pelajaran</option>
                        {JENIS_PEMBELAJARAN.map((j) => (<option key={j} value={j}>{j}</option>))}
                      </select>
                      {jenisPembelajaran === 'Lainnya' && (
                        <input type="text" value={jenisLainnya} onChange={(e) => setJenisLainnya(e.target.value)}
                          placeholder="Tulis nama mata pelajaran..." required
                          className={`${inputClass} mt-2`} />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi Mengajar <span className="text-red-500">*</span></label>
                      <select value={lokasiMengajar} onChange={(e) => setLokasiMengajar(e.target.value)} required className={selectClass}>
                        <option value="">Pilih Lokasi Mengajar</option>
                        {LESSON_LOCATIONS.map((l) => (<option key={l} value={l}>{l}</option>))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kelas Murid <span className="text-red-500">*</span></label>
                    <select value={kelasMurid} onChange={(e) => setKelasMurid(e.target.value)} required className={selectClass}>
                      <option value="">Pilih Kelas Murid</option>
                      {KELAS_MURID.map((k) => (<option key={k} value={k}>{k}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan <span className="text-red-500">*</span></label>
                    <textarea value={catatanMateri} onChange={(e) => setCatatanMateri(e.target.value)} required rows={4}
                      placeholder="Rangkuman aktivitas dan materi yang diajarkan hari ini. Jangan terlalu singkat, jelaskan dengan detail."
                      className={inputClass + ' resize-none'} />
                    {catatanMateri.trim().length > 0 && catatanMateri.trim().length < MIN_CATATAN_MATERI_LENGTH && (
                      <p className="text-xs text-red-500 mt-1">Catatan terlalu singkat, jelaskan lebih detail (minimal 20 karakter)</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Singkat Perkembangan atau Kendala</label>
                    <textarea value={kritikSaran} onChange={(e) => setKritikSaran(e.target.value)} rows={3}
                      placeholder="Kendala yang dihadapi atau catatan perkembangan murid."
                      className={inputClass + ' resize-none'} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4b5563' }}>Lampiran Foto Kegiatan</label>
                    
                    {imagePreviewUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-w-xs bg-white/50 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreviewUrl} alt="Preview Foto Les" className="w-full h-40 object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                          title="Hapus Foto"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="text-[10px] text-gray-500 font-semibold px-2 py-1 truncate">{selectedFile?.name}</p>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 cursor-pointer bg-white/30 hover:bg-white/50 transition-all hover:border-indigo-400">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-gray-700">Ambil Foto Langsung atau Pilih File</span>
                        <span className="text-[10px] text-gray-400 mt-1 font-medium">Mendukung kamera HP & file gambar (PNG, JPG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
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
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Menyimpan...' : 'Submit & Kirim Laporan'}
                  </button>
                  <button type="button" onClick={handleResetSelection} className="btn-secondary">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}
