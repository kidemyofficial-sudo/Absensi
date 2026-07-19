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
const ADMIN_WA = '6281234567890'

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
  const [submittedLinks, setSubmittedLinks] = useState<{ parent: string; admin: string } | null>(null)

  const [tanggalLes, setTanggalLes] = useState(new Date().toISOString().split('T')[0])
  const [jenisPembelajaran, setJenisPembelajaran] = useState('')
  const [jenisLainnya, setJenisLainnya] = useState('')
  const [lokasiMengajar, setLokasiMengajar] = useState('')
  const [kelasMurid, setKelasMurid] = useState('')
  const [catatanMateri, setCatatanMateri] = useState('')
  const [kritikSaran, setKritikSaran] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [namaWaliMurid, setNamaWaliMurid] = useState('')
  const [whatsappWaliMurid, setWhatsappWaliMurid] = useState('')

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
    const trimmedFotoUrl = fotoUrl.trim()
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

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggalLes, jenisPembelajaran: resolvedJenisPembelajaran, lokasiMengajar, kelasMurid,
          jumlahMurid: 1,
          namaMurid, catatanMateri: trimmedCatatanMateri, kritikSaran: trimmedKritikSaran || null,
          fotoUrl: trimmedFotoUrl || null, jamMulai, jamSelesai,
          namaWaliMurid: trimmedNamaWaliMurid, whatsappWaliMurid: trimmedWhatsappWaliMurid || null,
          studentId: selectedStudentId,
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
          `📚 Mata Pelajaran/Topik: ${resolvedJenisPembelajaran}\n` +
          `📍 Lokasi: ${lokasiMengajar}\n` +
          `🏫 Kelas: ${kelasMurid}\n` +
          `👨‍🎓 Murid: ${namaMurid}\n` +
          `🕐 Jam: ${jamMulai} - ${jamSelesai}\n` +
          `📝 Rangkuman Aktivitas: ${trimmedCatatanMateri}\n` +
          (trimmedKritikSaran ? `💡 Catatan Perkembangan/Kendala: ${trimmedKritikSaran}\n` : '') +
          `👨‍👩‍👦 Wali: ${trimmedNamaWaliMurid}\n` +
          (trimmedWhatsappWaliMurid ? `📱 WA Wali: ${trimmedWhatsappWaliMurid}` : '')
        )

        const cleanParentPhone = formatWhatsAppNumber(trimmedWhatsappWaliMurid)
        const cleanAdminPhone = formatWhatsAppNumber(ADMIN_WA)

        const parentLink = `https://wa.me/${cleanParentPhone}?text=${waMessage}`
        const adminLink = `https://wa.me/${cleanAdminPhone}?text=${waMessage}`

        // Coba otomatis buka chat wa
        if (cleanParentPhone) {
          window.open(parentLink, '_blank')
        }
        setTimeout(() => {
          window.open(adminLink, '_blank')
        }, 300)

        // Set link untuk halaman sukses
        setSubmittedLinks({ parent: parentLink, admin: adminLink })
        setMessage({ type: 'success', text: 'Absensi berhasil disimpan!' })
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
    setFotoUrl('')
    setJamMulai('')
    setJamSelesai('')
    setNamaWaliMurid('')
    setWhatsappWaliMurid('')
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

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all text-sm"
  const selectClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all text-sm"

  return (
    <div className="max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Input Absensi Les</h1>
        <p className="text-sm text-gray-500 mt-1">Cari murid lalu isi laporan aktivitas les harian</p>
      </div>

      {/* STATE 3: HALAMAN SUKSES DENGAN DUA TOMBOL WHATSAPP */}
      {submittedLinks ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Absensi Berhasil Disimpan!</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Laporan absensi untuk <strong className="text-gray-700">{selectedStudent?.name}</strong> telah tercatat di sistem. 
              Silakan kirimkan laporan ini kepada wali murid dan admin melalui tombol WhatsApp di bawah.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs text-left">
            <strong>Catatan:</strong> Jika tab WhatsApp tidak terbuka secara otomatis, Anda dapat mengklik tombol di bawah ini secara manual untuk mengirim laporan.
          </div>

          <div className="flex flex-col gap-3">
            {selectedStudent?.parent?.phone ? (
              <a
                href={submittedLinks.parent}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm shadow-emerald-200 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.18 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.64 1.97 14.185.94 11.553.94c-5.445 0-9.87 4.37-9.874 9.8.001 2.07.545 4.093 1.58 5.864L2.247 20.8l4.4-1.646zm11.83-6.182c-.3-.149-1.774-.863-2.048-.962-.274-.1-.474-.149-.674.15-.2.299-.774.962-.948 1.16-.174.2-.349.224-.649.075-.3-.15-1.264-.462-2.408-1.472-.89-.785-1.49-1.755-1.665-2.053-.174-.299-.018-.46.131-.609.135-.134.3-.349.449-.523.149-.174.2-.299.3-.498.1-.2.05-.374-.025-.524-.075-.15-.674-1.603-.923-2.199-.243-.58-.49-.5-.674-.51-.174-.01-.374-.01-.573-.01-.2 0-.524.075-.798.374-.274.299-1.047 1.022-1.047 2.492 0 1.47 1.071 2.889 1.221 3.088.15.2 2.107 3.2 5.104 4.492.713.307 1.27.491 1.704.629.717.227 1.369.195 1.884.118.574-.085 1.774-.718 2.023-1.411.249-.693.249-1.289.174-1.411-.075-.122-.274-.199-.573-.348z"/>
                </svg>
                Kirim Laporan ke Wali Murid ({selectedStudent?.parent?.name})
              </a>
            ) : (
              <div className="text-sm text-red-500 bg-red-50 py-2.5 rounded-xl border border-red-100">
                Wali murid tidak memiliki nomor WhatsApp yang terdaftar.
              </div>
            )}

            <a
              href={submittedLinks.admin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm shadow-emerald-200 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.18 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.64 1.97 14.185.94 11.553.94c-5.445 0-9.87 4.37-9.874 9.8.001 2.07.545 4.093 1.58 5.864L2.247 20.8l4.4-1.646zm11.83-6.182c-.3-.149-1.774-.863-2.048-.962-.274-.1-.474-.149-.674.15-.2.299-.774.962-.948 1.16-.174.2-.349.224-.649.075-.3-.15-1.264-.462-2.408-1.472-.89-.785-1.49-1.755-1.665-2.053-.174-.299-.018-.46.131-.609.135-.134.3-.349.449-.523.149-.174.2-.299.3-.498.1-.2.05-.374-.025-.524-.075-.15-.674-1.603-.923-2.199-.243-.58-.49-.5-.674-.51-.174-.01-.374-.01-.573-.01-.2 0-.524.075-.798.374-.274.299-1.047 1.022-1.047 2.492 0 1.47 1.071 2.889 1.221 3.088.15.2 2.107 3.2 5.104 4.492.713.307 1.27.491 1.704.629.717.227 1.369.195 1.884.118.574-.085 1.774-.718 2.023-1.411.249-.693.249-1.289.174-1.411-.075-.122-.274-.199-.573-.348z"/>
              </svg>
              Kirim Laporan ke Admin (Kidemy)
            </a>
          </div>

          <button
            onClick={handleResetForm}
            className="w-full py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium transition-colors"
          >
            Kembali ke Daftar Murid
          </button>
        </div>
      ) : (
        <>
          {/* STATE 1: GURU PILIH MURID DULU */}
          {!selectedStudent ? (
            <div className="space-y-6">
              {/* Kolom Pencarian */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-96 relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama murid..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all text-sm"
                  />
                </div>
                <div className="text-xs text-gray-400">
                  Total Murid: {students.length}
                </div>
              </div>

              {/* Grid Murid */}
              {filteredStudents.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400 text-sm">
                  {students.length === 0 
                    ? "Belum ada murid yang ditugaskan ke Anda. Silakan hubungi admin/owner."
                    : "Murid dengan nama tersebut tidak ditemukan."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredStudents.map((student) => (
                    <div 
                      key={student.id} 
                      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{student.name}</h3>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700">
                              {student.cabangDaerah || 'Belum ada cabang'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-50 space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Wali:</span>
                            <span className="font-medium text-gray-700">{student.parent?.name || '-'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>WhatsApp:</span>
                            <span className="font-medium text-gray-700">{student.parent?.phone || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectStudent(student)}
                        className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-base shadow-sm">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-base">{selectedStudent.name}</h4>
                      <span className="px-2 py-0.5 rounded bg-blue-200/60 text-blue-800 text-[10px] font-bold">
                        {selectedStudent.cabangDaerah || 'Umum'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Wali: <strong className="text-gray-700">{selectedStudent.parent?.name || '-'}</strong> | WA: <strong className="text-gray-700">{selectedStudent.parent?.phone || '-'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetSelection}
                  className="px-4 py-2 border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-xl transition-all self-start sm:self-auto"
                >
                  Ganti Murid
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
                <strong>Perhatian:</strong> Jika terjadi kendala, harap segera konfirmasi ke admin dan catat manual.
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
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
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Mata Pelajaran/Topik <span className="text-red-500">*</span></label>
                      <select value={jenisPembelajaran} onChange={(e) => { setJenisPembelajaran(e.target.value); if (e.target.value !== 'Lainnya') setJenisLainnya('') }} required className={selectClass}>
                        <option value="">Pilih Mata Pelajaran</option>
                        {JENIS_PEMBELAJARAN.map((j) => (<option key={j} value={j}>{j}</option>))}
                      </select>
                      {jenisPembelajaran === 'Lainnya' && (
                        <input type="text" value={jenisLainnya} onChange={(e) => setJenisLainnya(e.target.value)}
                          placeholder="Tulis nama mata pelajaran..." required
                          className="w-full mt-2 px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white transition-all text-sm" />
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
                    {saving ? 'Menyimpan...' : 'Submit & Kirim Laporan'}
                  </button>
                  <button type="button" onClick={handleResetSelection}
                    className="bg-white text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-center border border-gray-200 transition-colors">
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
