import { registerStudent } from '@/app/(dashboard)/dashboard/actions'

const inputStyle = {
  width: '100%',
  padding: '0.65rem 1rem',
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(209,213,219,0.6)',
  borderRadius: '12px',
  fontSize: '0.875rem',
  color: '#1e1b4b',
  outline: 'none',
  transition: 'all 0.2s ease',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '6px',
}

export default function StudentForm() {
  return (
    <form action={registerStudent}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Nama Lengkap</label>
          <input
            type="text"
            name="name"
            required
            className="glass-input"
            placeholder="Nama lengkap siswa"
          />
        </div>
        <div>
          <label style={labelStyle}>Tempat, Tanggal Lahir</label>
          <input
            type="text"
            name="ttl"
            required
            className="glass-input"
            placeholder="contoh: Jakarta, 1 Januari 2010"
          />
        </div>
        <div>
          <label style={labelStyle}>Domisili</label>
          <input
            type="text"
            name="domisili"
            required
            className="glass-input"
            placeholder="Alamat domisili"
          />
        </div>
        <div>
          <label style={labelStyle}>Asal Sekolah</label>
          <input
            type="text"
            name="asalSekolah"
            required
            className="glass-input"
            placeholder="Nama sekolah asal"
          />
        </div>
      </div>
      <button type="submit" className="btn-primary mt-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Daftarkan Siswa
      </button>
    </form>
  )
}
