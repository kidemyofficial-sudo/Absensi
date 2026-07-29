'use client'

import { useState, useEffect, useCallback } from 'react'
import GajiGuruDetailModal from '@/components/GajiGuruDetailModal'
import { SlipGajiPrintButton, KirimWhatsAppButton } from '@/components/SlipGajiButton'

interface GajiGuru {
  guruId: string
  namaGuru: string
  whatsappGuru: string
  phoneGuru: string
  jumlahLes: number
  totalBiayaLes: number
  totalGajiGuru: number
  totalBagianOwner: number
  isPaid: boolean
  paidAt: string | null
  paymentId: string | null
}

interface Summary {
  bulan: number
  tahun: number
  totalGuru: number
  totalGajiSemua: number
  totalBelumDibayar: number
  totalSudahDibayar: number
}

interface DetailGuru {
  guru: { id: string; name: string; phone: string }
  revenues: any[]
  summary: {
    bulan: number
    tahun: number
    jumlahLes: number
    totalBiayaLes: number
    totalGajiGuru: number
    totalBagianOwner: number
  }
  payment: any
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function namaBulan(b: number, t: number) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(t, b - 1, 1))
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function GajiGuruPage() {
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [gajiList, setGajiList] = useState<GajiGuru[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<DetailGuru | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchGaji = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`/api/gaji-guru?bulan=${bulan}&tahun=${tahun}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data')
      setGajiList(data.gajiList || [])
      setSummary(data.summary || null)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }, [bulan, tahun])

  useEffect(() => { fetchGaji() }, [fetchGaji])

  const openDetail = async (guruId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/gaji-guru/${guruId}?bulan=${bulan}&tahun=${tahun}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil detail')
      setSelectedDetail(data)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setIsSuccess(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleTogglePaid = async (guruId: string, newPaidStatus: boolean, totalGaji: number) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/gaji-guru/${guruId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newPaidStatus ? 'MARK_PAID' : 'MARK_UNPAID',
          bulan,
          tahun,
          totalGaji,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status')
      setMessage(data.message || 'Status berhasil diubah')
      setIsSuccess(true)
      // Refresh list and detail
      await fetchGaji()
      if (selectedDetail) {
        const detailRes = await fetch(`/api/gaji-guru/${guruId}?bulan=${bulan}&tahun=${tahun}`)
        const detailData = await detailRes.json()
        if (detailRes.ok) setSelectedDetail(detailData)
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setIsSuccess(false)
    } finally {
      setActionLoading(false)
    }
  }

  const tahunOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  return (
    <div>
      {selectedDetail && (
        <GajiGuruDetailModal
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onTogglePaid={handleTogglePaid}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Gaji Guru</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Rekap pembayaran gaji guru per periode
          </p>
        </div>
        {/* Filter Periode */}
        <div className="flex items-center gap-2">
          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className="glass-input text-sm py-2 px-3"
            style={{ minWidth: 120 }}
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="glass-input text-sm py-2 px-3"
            style={{ minWidth: 80 }}
          >
            {tahunOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pesan */}
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Total Guru</p>
            <p className="text-2xl font-extrabold" style={{ color: '#4f46e5' }}>{summary.totalGuru}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Total Gaji</p>
            <p className="text-lg font-extrabold" style={{ color: '#1e1b4b' }}>{formatRp(summary.totalGajiSemua)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Belum Dibayar</p>
            <p className="text-lg font-extrabold" style={{ color: '#dc2626' }}>{formatRp(summary.totalBelumDibayar)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Sudah Dibayar</p>
            <p className="text-lg font-extrabold" style={{ color: '#059669' }}>{formatRp(summary.totalSudahDibayar)}</p>
          </div>
        </div>
      )}

      {/* Tabel Rekap */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(229,231,235,0.45)' }}>
          <h3 className="text-base font-bold" style={{ color: '#1e1b4b' }}>
            Rekap Gaji — {namaBulan(bulan, tahun)}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Memuat data...</div>
        ) : gajiList.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Belum ada data les untuk periode ini</p>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Data gaji otomatis muncul setelah guru mengisi laporan les</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table w-full">
              <thead>
                <tr>
                  <th>Nama Guru</th>
                  <th className="text-center">Jumlah Les</th>
                  <th className="text-right">Total Biaya Les</th>
                  <th className="text-right">Gaji Guru</th>
                  <th className="text-right">Bagian Owner</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {gajiList.map((g) => (
                  <tr key={g.guruId}>
                    <td className="font-bold whitespace-nowrap" style={{ color: '#1e1b4b' }}>{g.namaGuru}</td>
                    <td className="text-center" style={{ color: '#4b5563' }}>{g.jumlahLes} sesi</td>
                    <td className="text-right" style={{ color: '#4b5563' }}>{formatRp(g.totalBiayaLes)}</td>
                    <td className="text-right font-bold" style={{ color: '#059669' }}>{formatRp(g.totalGajiGuru)}</td>
                    <td className="text-right font-bold" style={{ color: '#6366f1' }}>{formatRp(g.totalBagianOwner)}</td>
                    <td className="text-center">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: g.isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: g.isPaid ? '#065f46' : '#991b1b',
                          border: `1px solid ${g.isPaid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
                        }}
                      >
                        {g.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        <button
                          onClick={() => openDetail(g.guruId)}
                          disabled={detailLoading}
                          className="px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors"
                          style={{ background: 'rgba(99,102,241,0.08)', color: '#4f46e5' }}
                        >
                          {detailLoading ? '...' : 'Lihat Detail'}
                        </button>
                        <SlipGajiPrintButton
                          namaGuru={g.namaGuru}
                          whatsappGuru={g.whatsappGuru || g.phoneGuru}
                          bulan={bulan}
                          tahun={tahun}
                          jumlahLes={g.jumlahLes}
                          totalBiayaLes={g.totalBiayaLes}
                          totalGajiGuru={g.totalGajiGuru}
                          revenues={[]}
                        />
                        <KirimWhatsAppButton
                          namaGuru={g.namaGuru}
                          whatsappGuru={g.whatsappGuru || g.phoneGuru}
                          bulan={bulan}
                          tahun={tahun}
                          jumlahLes={g.jumlahLes}
                          totalGajiGuru={g.totalGajiGuru}
                        />
                        <button
                          onClick={() => handleTogglePaid(g.guruId, !g.isPaid, g.totalGajiGuru)}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors"
                          style={{
                            background: g.isPaid ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                            color: g.isPaid ? '#991b1b' : '#065f46',
                          }}
                        >
                          {g.isPaid ? 'Reset' : 'Tandai Dibayar'}
                        </button>
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
