'use client'

import { SlipGajiPrintButton, KirimWhatsAppButton } from '@/components/SlipGajiButton'

interface LesRevenue {
  id: string
  biayaTotal: number
  pendapatanGuru: number
  pendapatanOwner: number
  lesson: {
    id: string
    tanggalLes: string
    namaMurid: string
    jumlahMurid: number
    jenisPembelajaran: string
    lokasiMengajar: string
    jamMulai: string
    jamSelesai: string
    biayaPerSiswa: number
    namaGuru: string
    whatsappGuru: string
  }
}

interface DetailGuru {
  guru: { id: string; name: string; phone: string }
  revenues: LesRevenue[]
  summary: {
    bulan: number
    tahun: number
    jumlahLes: number
    totalBiayaLes: number
    totalGajiGuru: number
    totalBagianOwner: number
  }
  payment: {
    id: string
    isPaid: boolean
    paidAt: string | null
    notes: string | null
  } | null
}

interface GajiGuruDetailModalProps {
  detail: DetailGuru
  onClose: () => void
  onTogglePaid: (guruId: string, isPaid: boolean, totalGaji: number) => Promise<void>
  loading: boolean
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function namaBulan(b: number, t: number) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(t, b - 1, 1))
}

function formatTanggal(d: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}

export default function GajiGuruDetailModal({ detail, onClose, onTogglePaid, loading }: GajiGuruDetailModalProps) {
  const { guru, revenues, summary, payment } = detail
  const isPaid = payment?.isPaid ?? false
  const periode = namaBulan(summary.bulan, summary.tahun)

  const sortedRevenues = [...revenues].sort(
    (a, b) => new Date(a.lesson.tanggalLes).getTime() - new Date(b.lesson.tanggalLes).getTime()
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,10,40,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="glass-card w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 p-6 flex-shrink-0" style={{ borderBottom: '1px solid rgba(229,231,235,0.45)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#1e1b4b' }}>Rincian Gaji Guru</h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              {guru.name} &bull; {periode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-50 flex-shrink-0"
            style={{ borderColor: 'rgba(229,231,235,0.7)' }}
            aria-label="Tutup"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 flex-shrink-0">
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Total Les</p>
            <p className="text-xl font-extrabold" style={{ color: '#4f46e5' }}>{summary.jumlahLes}</p>
            <p className="text-xs" style={{ color: '#9ca3af' }}>sesi</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Gaji Guru</p>
            <p className="text-sm font-extrabold" style={{ color: '#059669' }}>{formatRp(summary.totalGajiGuru)}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Total Les</p>
            <p className="text-sm font-extrabold" style={{ color: '#6366f1' }}>{formatRp(summary.totalBiayaLes)}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Bagian Owner</p>
            <p className="text-sm font-extrabold" style={{ color: '#b45309' }}>{formatRp(summary.totalBagianOwner)}</p>
          </div>
        </div>

        {/* Status Pembayaran */}
        <div className="px-5 pb-4 flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: isPaid ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                color: isPaid ? '#065f46' : '#991b1b',
                border: `1px solid ${isPaid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
              }}
            >
              {isPaid ? '✓ Sudah Dibayar' : '✗ Belum Dibayar'}
            </span>
            {isPaid && payment?.paidAt && (
              <span className="text-xs" style={{ color: '#6b7280' }}>
                pada {formatTanggal(payment.paidAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SlipGajiPrintButton
              namaGuru={guru.name}
              whatsappGuru={guru.phone}
              bulan={summary.bulan}
              tahun={summary.tahun}
              jumlahLes={summary.jumlahLes}
              totalBiayaLes={summary.totalBiayaLes}
              totalGajiGuru={summary.totalGajiGuru}
              revenues={revenues}
            />
            <KirimWhatsAppButton
              namaGuru={guru.name}
              whatsappGuru={revenues[0]?.lesson.whatsappGuru || guru.phone}
              bulan={summary.bulan}
              tahun={summary.tahun}
              jumlahLes={summary.jumlahLes}
              totalGajiGuru={summary.totalGajiGuru}
            />
            <button
              onClick={() => onTogglePaid(guru.id, !isPaid, summary.totalGajiGuru)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: isPaid ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                color: isPaid ? '#991b1b' : '#065f46',
              }}
            >
              {loading ? 'Memproses...' : isPaid ? 'Tandai Belum Dibayar' : 'Tandai Sudah Dibayar'}
            </button>
          </div>
        </div>

        {/* Tabel Detail Les */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(229,231,235,0.4)' }}>
              <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Detail Per Les</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="glass-table w-full">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jenis Les</th>
                    <th>Murid</th>
                    <th className="text-center">Jml</th>
                    <th>Jam</th>
                    <th className="text-right">Total Biaya</th>
                    <th className="text-right">Bagian Guru</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRevenues.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap" style={{ color: '#374151' }}>{formatTanggal(r.lesson.tanggalLes)}</td>
                      <td style={{ color: '#4b5563' }}>{r.lesson.jenisPembelajaran}</td>
                      <td className="font-medium" style={{ color: '#1e1b4b' }}>{r.lesson.namaMurid}</td>
                      <td className="text-center" style={{ color: '#6b7280' }}>{r.lesson.jumlahMurid}</td>
                      <td className="whitespace-nowrap" style={{ color: '#4b5563' }}>{r.lesson.jamMulai} – {r.lesson.jamSelesai}</td>
                      <td className="text-right font-medium" style={{ color: '#4b5563' }}>{formatRp(r.biayaTotal)}</td>
                      <td className="text-right font-bold" style={{ color: '#059669' }}>{formatRp(r.pendapatanGuru)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(229,231,235,0.6)' }}>
                    <td colSpan={5} className="text-right font-bold text-sm py-3 pr-2" style={{ color: '#1e1b4b' }}>Total</td>
                    <td className="text-right font-bold text-sm py-3" style={{ color: '#6366f1' }}>{formatRp(summary.totalBiayaLes)}</td>
                    <td className="text-right font-bold text-sm py-3" style={{ color: '#059669' }}>{formatRp(summary.totalGajiGuru)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
