'use client'

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

interface SlipGajiButtonProps {
  namaGuru: string
  whatsappGuru: string   // nomor WA guru, format bebas
  bulan: number
  tahun: number
  jumlahLes: number
  totalBiayaLes: number
  totalGajiGuru: number
  revenues: LesRevenue[]
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function namaBulan(b: number, t: number) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(t, b - 1, 1))
}

function formatTanggal(d: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))
}

// Bersihkan nomor telepon ke format internasional Indonesia
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return '62' + digits
}

export function SlipGajiPrintButton({
  namaGuru,
  bulan,
  tahun,
  jumlahLes,
  totalBiayaLes,
  totalGajiGuru,
  revenues,
}: SlipGajiButtonProps) {
  const handlePrint = async () => {
    // Load logo Kidemy sebagai base64
    let logoHtml = ''
    try {
      const res = await fetch('/image/kidemy.webp')
      if (res.ok) {
        const blob = await res.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        logoHtml = `<img src="${base64}" alt="Kidemy" class="logo" />`
      }
    } catch {
      // Lanjut tanpa logo
    }

    const periode = namaBulan(bulan, tahun)
    const bagianOwner = totalBiayaLes - totalGajiGuru

    const sortedRevenues = [...revenues].sort(
      (a, b) => new Date(a.lesson.tanggalLes).getTime() - new Date(b.lesson.tanggalLes).getTime()
    )

    const rows = sortedRevenues.map((r, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${formatTanggal(r.lesson.tanggalLes)}</td>
        <td>${r.lesson.jenisPembelajaran}</td>
        <td>${r.lesson.namaMurid}</td>
        <td style="text-align:center">${r.lesson.jumlahMurid}</td>
        <td>${r.lesson.jamMulai} – ${r.lesson.jamSelesai}</td>
        <td style="text-align:right">${formatRp(r.lesson.biayaPerSiswa)}</td>
        <td style="text-align:right">${formatRp(r.biayaTotal)}</td>
        <td style="text-align:right">${formatRp(r.pendapatanGuru)}</td>
      </tr>
    `).join('')

    const printWindow = window.open('', '_blank', 'width=1100,height=700')
    if (!printWindow) return

    printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Slip Gaji – ${namaGuru} – ${periode}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; padding: 24px 32px; }
    .header { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #6366f1; margin-bottom: 18px; }
    .logo { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; }
    .header-text h1 { font-size: 17px; font-weight: 800; color: #1e1b4b; }
    .header-text p { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .slip-title { text-align: center; font-size: 14px; font-weight: 700; color: #4f46e5; margin-bottom: 14px; letter-spacing: 0.5px; text-transform: uppercase; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 18px; background: #f8f7ff; border-radius: 8px; padding: 12px 16px; }
    .info-row { display: flex; gap: 8px; }
    .info-label { color: #6b7280; min-width: 110px; font-size: 10.5px; }
    .info-value { font-weight: 600; color: #1e1b4b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px; }
    thead tr { background: #4f46e5; color: white; }
    th { padding: 7px 8px; text-align: left; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f5f3ff; }
    tbody tr:nth-child(odd) { background: #fff; }
    td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    .summary-box { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; }
    .sum-item p { font-size: 9px; opacity: 0.8; margin-bottom: 4px; }
    .sum-item span { font-size: 13px; font-weight: 800; }
    .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
    .sig-box { text-align: center; }
    .sig-box p { font-size: 10px; color: #374151; }
    .sig-line { border-top: 1px solid #9ca3af; margin-top: 48px; padding-top: 6px; font-size: 10px; color: #374151; }
    .note { font-size: 9px; color: #9ca3af; text-align: center; margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    @media print { body { padding: 8px 12px; } }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="header-text">
      <h1>Kidemy</h1>
      <p>Sistem Absensi & Manajemen Les Privat</p>
    </div>
  </div>

  <p class="slip-title">Slip Gaji Guru – ${periode}</p>

  <div class="info-grid">
    <div class="info-row"><span class="info-label">Nama Guru</span><span class="info-value">${namaGuru}</span></div>
    <div class="info-row"><span class="info-label">Periode</span><span class="info-value">${periode}</span></div>
    <div class="info-row"><span class="info-label">Total Pertemuan</span><span class="info-value">${jumlahLes} Sesi</span></div>
    <div class="info-row"><span class="info-label">Tanggal Cetak</span><span class="info-value">${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:28px">No</th>
        <th>Tanggal</th>
        <th>Jenis Les</th>
        <th>Murid</th>
        <th style="text-align:center">Jml Murid</th>
        <th>Jam</th>
        <th style="text-align:right">Biaya/Siswa</th>
        <th style="text-align:right">Total Biaya</th>
        <th style="text-align:right">Bagian Guru</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="summary-box">
    <div class="sum-item">
      <p>Total Biaya Les</p>
      <span>${formatRp(totalBiayaLes)}</span>
    </div>
    <div class="sum-item">
      <p>Gaji Guru (Bagian Guru)</p>
      <span>${formatRp(totalGajiGuru)}</span>
    </div>
    <div class="sum-item">
      <p>Bagian Owner</p>
      <span>${formatRp(bagianOwner)}</span>
    </div>
  </div>

  <div class="footer">
    <div class="sig-box">
      <p>Penerima Gaji</p>
      <div class="sig-line">${namaGuru}</div>
    </div>
    <div class="sig-box">
      <p>Mengetahui, Owner</p>
      <div class="sig-line">.....................................</div>
    </div>
  </div>

  <p class="note">Slip gaji ini diterbitkan otomatis oleh sistem Kidemy. Harap simpan sebagai bukti pembayaran.</p>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
      style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}
      title="Cetak Slip Gaji PDF"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
      </svg>
      Cetak Slip
    </button>
  )
}

export function KirimWhatsAppButton({
  namaGuru,
  whatsappGuru,
  bulan,
  tahun,
  jumlahLes,
  totalGajiGuru,
}: Omit<SlipGajiButtonProps, 'revenues' | 'totalBiayaLes'>) {
  const handleKirim = () => {
    const periode = namaBulan(bulan, tahun)
    // Ambil nama depan untuk sapaan
    const namaDepan = namaGuru.split(' ')[0]
    const pesan = `Assalamu'alaikum Kak ${namaDepan} 🙏\n\nBerikut kami sampaikan rincian gaji mengajar Kak ${namaDepan} untuk periode *${periode}*.\n\nTotal pertemuan: *${jumlahLes} sesi*\nTotal gaji: *${formatRp(totalGajiGuru)}*\n\nSilakan dicek kembali rincian gaji pada slip yang telah kami lampirkan.\n\nJika terdapat ketidaksesuaian atau ada yang ingin ditanyakan, silakan dikonfirmasi kepada admin.\n\nTerima kasih atas kontribusi dan kerja samanya 🙏\n\n_Wassalamu'alaikum warahmatullahi wabarakatuh_`

    // Coba whatsappGuru dulu, fallback ke phone
    const targetPhone = whatsappGuru || ''
    if (!targetPhone) {
      alert('Nomor WhatsApp guru tidak tersedia.')
      return
    }

    const normalized = normalizePhone(targetPhone)
    const encoded = encodeURIComponent(pesan)
    window.open(`https://wa.me/${normalized}?text=${encoded}`, '_blank')
  }

  return (
    <button
      onClick={handleKirim}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
      style={{ background: 'rgba(16,185,129,0.1)', color: '#065f46' }}
      title="Kirim ringkasan gaji ke WhatsApp guru"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.559 4.14 1.535 5.879L.057 23.429a.75.75 0 00.937.937l5.55-1.478A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.79-.56-5.33-1.528l-.37-.228-3.835 1.02 1.02-3.835-.228-.37A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
      Kirim WhatsApp
    </button>
  )
}
