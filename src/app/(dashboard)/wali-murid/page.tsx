'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import PasswordStrength from '@/components/PasswordStrength'
import PasswordVisibilityToggle from '@/components/PasswordVisibilityToggle'

interface Parent {
  id: string
  name: string
  phone: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  students: {
    id: string
    name: string
  }[]
}

export default function WaliMuridPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', password: '' })
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [showStorage, setShowStorage] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState<{ id: string; name: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editParent, setEditParent] = useState<{
    id: string
    name: string
    phone: string
    password: string
    confirmPassword: string
  } | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false)

  const fetchParents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('role', 'ORANG_TUA')
    if (search) params.set('search', search)
    if (showStorage) params.set('archived', '1')
    const res = await fetch(`/api/users?${params.toString()}`)
    const data = await res.json()
    setParents(data.users || [])
    setLoading(false)
  }, [search, showStorage])

  useEffect(() => {
    fetchParents()
  }, [fetchParents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'ORANG_TUA' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal tambah wali murid')
      setMessage('Wali Murid berhasil ditambahkan!')
      setFormData({ name: '', phone: '', password: '' })
      setShowForm(false)
      fetchParents()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return
    setDeleteConfirm(null)
    try {
      const res = await fetch(`/api/users/${deleteConfirm.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal hapus wali murid')
      }
      setMessage('Wali Murid berhasil dihapus!')
      fetchParents()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleApprove = async (id: string) => {
    setMessage('')
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyetujui akun')
      setMessage('Akun wali murid berhasil disetujui!')
      fetchParents()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleArchiveConfirmed = async () => {
    if (!archiveConfirm) return
    setActionLoading(archiveConfirm.id)
    setArchiveConfirm(null)
    setMessage('')
    try {
      const res = await fetch(`/api/users/${archiveConfirm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memindahkan ke storage')
      setMessage(data.message || 'Wali murid dipindahkan ke storage')
      fetchParents()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestore = async (parent: Parent) => {
    setActionLoading(parent.id)
    setMessage('')
    try {
      const res = await fetch(`/api/users/${parent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memulihkan wali murid')
      setMessage(data.message || 'Wali murid berhasil dipulihkan dari storage')
      fetchParents()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setActionLoading(null)
    }
  }

  const openEditForm = (parent: Parent) => {
    setMessage('')
    setShowEditPassword(false)
    setShowEditConfirmPassword(false)
    setEditParent({
      id: parent.id,
      name: parent.name,
      phone: parent.phone,
      password: '',
      confirmPassword: '',
    })
  }

  const closeEditForm = () => {
    setEditParent(null)
    setSavingEdit(false)
    setShowEditPassword(false)
    setShowEditConfirmPassword(false)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editParent) return

    const phone = editParent.phone.trim()
    const password = editParent.password.trim()
    const confirmPassword = editParent.confirmPassword.trim()

    if (phone.length < 10) {
      setMessage('Nomor telepon minimal 10 digit')
      return
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setMessage('Konfirmasi password tidak cocok')
        return
      }

      if (password.length < 8) {
        setMessage('Password minimal 8 karakter')
        return
      }
    }

    setSavingEdit(true)
    setMessage('')

    try {
      const payload: { phone: string; password?: string } = { phone }
      if (password) {
        payload.password = password
      }

      const res = await fetch(`/api/users/${editParent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah data wali murid')

      setMessage(password ? 'No HP dan password wali murid berhasil diperbarui!' : 'No HP wali murid berhasil diperbarui!')
      closeEditForm()
      fetchParents()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSavingEdit(false)
    }
  }

  const isSuccess = message.toLowerCase().includes('berhasil') || message.toLowerCase().includes('dipindahkan') || message.toLowerCase().includes('dipulihkan')

  return (
    <div>
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Wali Murid"
        message={`Yakin ingin menghapus wali murid ${deleteConfirm?.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />
      <ConfirmDialog
        isOpen={!!archiveConfirm}
        title="Pindah ke Storage"
        message={`Yakin ingin memindahkan wali murid ${archiveConfirm?.name} ke storage? Akun tidak akan bisa login, namun data tetap tersimpan.`}
        confirmText="Ya, Pindahkan"
        variant="danger"
        onConfirm={handleArchiveConfirmed}
        onCancel={() => setArchiveConfirm(null)}
      />
      {editParent && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#1e1b4b' }}>Edit Wali Murid</h3>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  Owner bisa mengganti nomor HP dan password akun wali murid yang sudah terdaftar.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditForm}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                aria-label="Tutup form edit wali murid"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Nama</label>
                  <input
                    type="text"
                    value={editParent.name}
                    disabled
                    className="glass-input"
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Nomor Telepon</label>
                  <input
                    type="tel"
                    value={editParent.phone}
                    onChange={(e) => setEditParent((prev) => prev ? { ...prev, phone: e.target.value } : prev)}
                    required
                    className="glass-input"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Password Baru</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editParent.password}
                      onChange={(e) => setEditParent((prev) => prev ? { ...prev, password: e.target.value } : prev)}
                      minLength={8}
                      className="glass-input pr-12"
                      placeholder="Kosongkan jika tidak diubah"
                    />
                    <PasswordVisibilityToggle
                      visible={showEditPassword}
                      onToggle={() => setShowEditPassword((prev) => !prev)}
                      labelVisible="Sembunyikan password baru wali murid"
                      labelHidden="Tampilkan password baru wali murid"
                    />
                  </div>
                  <PasswordStrength password={editParent.password} className="mt-3" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Konfirmasi Password</label>
                  <div className="relative">
                    <input
                      type={showEditConfirmPassword ? 'text' : 'password'}
                      value={editParent.confirmPassword}
                      onChange={(e) => setEditParent((prev) => prev ? { ...prev, confirmPassword: e.target.value } : prev)}
                      minLength={8}
                      className="glass-input pr-12"
                      placeholder="Ulangi password baru"
                    />
                    <PasswordVisibilityToggle
                      visible={showEditConfirmPassword}
                      onToggle={() => setShowEditConfirmPassword((prev) => !prev)}
                      labelVisible="Sembunyikan konfirmasi password wali murid"
                      labelHidden="Tampilkan konfirmasi password wali murid"
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                    Jika password diisi, gunakan minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeEditForm}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Wali Murid</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Kelola data wali murid (aktif &amp; storage)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Aktif / Storage */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowStorage(false); setMessage('') }}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-colors border"
              style={{
                background: !showStorage ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.6)',
                color: !showStorage ? '#4f46e5' : '#64748b',
                borderColor: !showStorage ? 'rgba(99,102,241,0.35)' : 'rgba(148,163,184,0.4)',
              }}
            >
              Aktif
            </button>
            <button
              onClick={() => { setShowStorage(true); setMessage('') }}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-colors border"
              style={{
                background: showStorage ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.6)',
                color: showStorage ? '#b45309' : '#64748b',
                borderColor: showStorage ? 'rgba(245,158,11,0.35)' : 'rgba(148,163,184,0.4)',
              }}
            >
              Storage
            </button>
          </div>
          {!showStorage && (
            <button
              onClick={() => { setShowForm(!showForm); setFormData({ name: '', phone: '', password: '' }) }}
              className="btn-primary"
            >
              {showForm ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Batal
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Tambah Wali Murid
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className="mb-5 p-3.5 rounded-xl text-sm font-medium"
          style={{
            background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: isSuccess ? '#065f46' : '#991b1b',
            border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {message}
        </div>
      )}

      {showForm && !showStorage && (
        <div className="glass-card p-6 mb-6">
          <h3 className="text-base font-bold mb-4" style={{ color: '#1e1b4b' }}>Tambah Wali Murid Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="glass-input"
                  placeholder="Nama wali murid"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Nomor Telepon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="glass-input"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="glass-input"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.25)' }}>
              Simpan
            </button>
          </form>
        </div>
      )}

      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama atau telepon wali murid..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-9"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>
        ) : parents.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>
            {showStorage ? 'Tidak ada wali murid di storage' : 'Tidak ada wali murid ditemukan'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table w-full">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Status</th>
                  <th>Siswa Terkait</th>
                  <th>Terdaftar</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr key={parent.id}>
                    <td className="font-bold whitespace-nowrap" style={{ color: '#1e1b4b' }}>{parent.name}</td>
                    <td className="whitespace-nowrap" style={{ color: '#4b5563' }}>{parent.phone}</td>
                    <td className="whitespace-nowrap">
                      {showStorage ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Storage
                        </span>
                      ) : parent.status === 'PENDING' ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Menunggu ACC
                        </span>
                      ) : parent.status === 'APPROVED' ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      {parent.students && parent.students.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {parent.students.map((student) => (
                            <span key={student.id} className="px-2.5 py-0.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                              {student.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap" style={{ color: '#4b5563' }}>
                      {new Date(parent.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {!showStorage ? (
                          <>
                            {parent.status === 'PENDING' && (
                              <button
                                onClick={() => handleApprove(parent.id)}
                                className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-xs transition-colors"
                              >
                                ACC
                              </button>
                            )}
                            <button
                              onClick={() => openEditForm(parent)}
                              className="px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg font-bold text-xs transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setArchiveConfirm({ id: parent.id, name: parent.name })}
                              disabled={actionLoading === parent.id}
                              className="px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors border"
                              style={{
                                background: 'rgba(245,158,11,0.1)',
                                color: '#b45309',
                                borderColor: 'rgba(245,158,11,0.3)',
                              }}
                            >
                              {actionLoading === parent.id ? 'Memproses...' : 'Storage'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: parent.id, name: parent.name })}
                              className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs transition-colors"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(parent)}
                              disabled={actionLoading === parent.id}
                              className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-xs transition-colors"
                            >
                              {actionLoading === parent.id ? 'Memproses...' : 'Pulihkan'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: parent.id, name: parent.name })}
                              className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs transition-colors"
                            >
                              Hapus Permanen
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
