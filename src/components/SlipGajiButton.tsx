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
  whatsappGuru: string
  bulan: number
  tahun: number
  jumlahLes: number
  totalBiayaLes: number
  totalGajiGuru: number
  revenues: LesRevenue[]
  guruId?: string  // opsional: jika diisi, revenues kosong akan di-fetch otomatis
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function namaBulanStr(b: number, t: number) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(t, b - 1, 1)
  )
}

function formatTanggalLong(d: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(d))
}

function formatTanggalShort(d: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d))
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return '62' + digits
}

async function loadImageAsBase64(path: string): Promise<string | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ── Slip Gaji Print ───────────────────────────────────────────────────────────
export function SlipGajiPrintButton({
  namaGuru,
  bulan,
  tahun,
  jumlahLes,
  totalGajiGuru,
  revenues,
  guruId,
}: SlipGajiButtonProps) {
  const handlePrint = async () => {
    // Jika revenues kosong dan guruId tersedia, fetch dulu dari API
    let finalRevenues = revenues
    if (finalRevenues.length === 0 && guruId) {
      try {
        const res = await fetch(`/api/gaji-guru/${guruId}?bulan=${bulan}&tahun=${tahun}`)
        const data = await res.json()
        if (res.ok && data.revenues) {
          finalRevenues = data.revenues
        }
      } catch {
        // lanjut dengan array kosong
      }
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    // Load aset gambar
    const [logoBase64, ttdBase64] = await Promise.all([
      loadImageAsBase64('/image/kidemy logo.png'),
      loadImageAsBase64('/image/ttdowner.png'),
    ])

    const logoHtml = logoBase64
      ? `<img src="${logoBase64}" alt="Kidemy Logo" />`
      : ''

    const ttdHtml = ttdBase64
      ? `<img src="${ttdBase64}" alt="TTD Owner" class="sig-image" />`
      : `<div class="sig-space"></div>`

    const periode = namaBulanStr(bulan, tahun)
    const tanggalCetak = formatTanggalLong(new Date().toISOString())

    const sorted = [...finalRevenues].sort(
      (a, b) =>
        new Date(a.lesson.tanggalLes).getTime() -
        new Date(b.lesson.tanggalLes).getTime()
    )

    const rows = sorted
      .map(
        (r, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${formatTanggalShort(r.lesson.tanggalLes)}</td>
        <td>${r.lesson.jenisPembelajaran}</td>
        <td>${r.lesson.namaMurid}</td>
        <td style="text-align:center">${r.lesson.jumlahMurid}</td>
        <td>${r.lesson.jamMulai} \u2013 ${r.lesson.jamSelesai}</td>
        <td class="amount">${formatRp(r.pendapatanGuru)}</td>
      </tr>`
      )
      .join('')

    printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Slip Gaji – ${namaGuru} – ${periode}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      color: #111827;
      background: #fff;
      padding: 32px 40px;
    }

    /* ── Header ───────────────────────────── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand img { height: 110px; object-fit: contain; }
    .header-right { text-align: right; }
    .header-right h2 { font-size: 14pt; font-weight: 700; color: #1e3a8a; }
    .header-right p { font-size: 9pt; color: #6b7280; margin-top: 3px; }

    /* ── Meta ─────────────────────────────── */
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
      background: #f0f7ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 20px;
    }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 8pt; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 11pt; font-weight: 600; color: #111827; }

    /* ── Salary Box ───────────────────────── */
    .salary-box {
      background: #1e3a8a;
      color: #fff;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .salary-box .label { font-size: 9pt; opacity: 0.75; }
    .salary-box .amount { font-size: 20pt; font-weight: 800; }
    .salary-box .sessions { font-size: 9pt; opacity: 0.85; text-align: right; }

    /* ── Table ────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 8.5pt;
      border: 1px solid #d1d5db;
    }
    thead tr { background: #1e3a8a; }
    thead th {
      color: #fff;
      font-weight: 600;
      padding: 8px;
      text-align: left;
      font-size: 8.5pt;
      letter-spacing: 0.2px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td {
      padding: 7px 8px;
      border: 1px solid #d1d5db;
      color: #374151;
      vertical-align: middle;
    }
    .amount { font-weight: 700; color: #166534; }

    /* ── Total Row ────────────────────────── */
    .total-row td {
      font-weight: 700;
      border-top: 2px solid #1e3a8a;
      background: #1e3a8a;
      padding: 10px 8px;
      font-size: 10pt;
      color: #ffffff;
    }

    /* ── Footer / TTD ─────────────────────── */
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-note { font-size: 8pt; color: #9ca3af; }
    .signature { text-align: center; font-size: 10pt; position: relative; }
    .signature .sig-title { font-weight: 400; color: #1f2937; margin-bottom: 4px; }
    .signature .sig-role  { font-weight: 600; color: #111827; margin-bottom: 8px; }
    .signature .sig-space {
      width: 180px; height: 80px; margin: 8px auto;
      border-bottom: 1px solid #374151; display: block;
    }
    .signature .sig-image {
      width: 160px; height: auto; max-height: 90px;
      margin: 8px auto; display: block; object-fit: contain;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .signature .sig-name { font-weight: 500; color: #374151; margin-top: 4px; }

    @media print {
      body { padding: 20px 25px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 10mm; }
      table, thead, tbody, tr, th, td { border-color: #d1d5db !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead tr { background: #1e3a8a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead th { color: #fff !important; }
      tbody tr:nth-child(even) { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .salary-box { background: #1e3a8a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .total-row td { background: #1e3a8a !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .meta { background: #f0f7ff !important; border-color: #bfdbfe !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .header { border-bottom: 2px solid #1e40af !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="brand">${logoHtml}</div>
    <div class="header-right">
      <h2>Slip Gaji Guru</h2>
      <p>Periode: ${periode}</p>
      <p>Dicetak: ${tanggalCetak}</p>
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Nama Guru</span>
      <span class="meta-value">${namaGuru}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Periode</span>
      <span class="meta-value">${periode}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Total Pertemuan</span>
      <span class="meta-value">${jumlahLes} Sesi</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Tanggal Cetak</span>
      <span class="meta-value">${tanggalCetak}</span>
    </div>
  </div>

  <!-- Salary Summary Box -->
  <div class="salary-box">
    <div>
      <div class="label">Total Gaji Guru</div>
      <div class="amount">${formatRp(totalGajiGuru)}</div>
    </div>
    <div class="sessions">
      <div>${jumlahLes} sesi mengajar</div>
      <div style="margin-top:4px;font-size:10pt;font-weight:700">${formatRp(Math.round(totalGajiGuru / (jumlahLes || 1)))} / sesi</div>
    </div>
  </div>

  <!-- Table Detail Per Les -->
  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:26px">No</th>
        <th>Tanggal</th>
        <th>Jenis Les</th>
        <th>Murid</th>
        <th style="text-align:center">Jumlah Murid</th>
        <th>Jam</th>
        <th style="text-align:right">Gaji Guru</th>
      </tr>
    </thead>
    <tbody>
      ${sorted.length > 0 ? rows : '<tr><td colspan="7" style="text-align:center;padding:16px;color:#9ca3af">Belum ada data les untuk periode ini</td></tr>'}
      <tr class="total-row">
        <td colspan="6">Total Gaji (${jumlahLes} Sesi)</td>
        <td style="text-align:right">${formatRp(totalGajiGuru)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-note">
      <p>Dokumen ini dibuat secara otomatis oleh sistem Kidemy.</p>
      <p>Hubungi admin jika terdapat ketidaksesuaian data.</p>
    </div>
    <div class="signature">
      <p class="sig-title">Mengetahui,</p>
      <p class="sig-role">Owner Kidemy</p>
      ${ttdHtml}
      <p class="sig-name">( Rahayu Wiladatika I, S.Pd )</p>
    </div>
  </div>

  <script>
    window.onload = () => { setTimeout(() => window.print(), 400); };
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
      </svg>
      Cetak Slip
    </button>
  )
}

// ── Kirim WhatsApp ────────────────────────────────────────────────────────────
export function KirimWhatsAppButton({
  namaGuru,
  whatsappGuru,
  bulan,
  tahun,
  jumlahLes,
  totalGajiGuru,
}: Omit<SlipGajiButtonProps, 'revenues' | 'totalBiayaLes'>) {
  const handleKirim = () => {
    const periode = namaBulanStr(bulan, tahun)
    const namaDepan = namaGuru.split(' ')[0]
    const pesan =
      `Assalamu'alaikum Kak ${namaDepan} 🙏\n\n` +
      `Berikut kami sampaikan rincian gaji mengajar Kak ${namaDepan} untuk periode *${periode}*.\n\n` +
      `Total pertemuan: *${jumlahLes} sesi*\n` +
      `Total gaji: *${formatRp(totalGajiGuru)}*\n\n` +
      `Silakan dicek kembali rincian gaji pada slip yang telah kami lampirkan.\n\n` +
      `Jika terdapat ketidaksesuaian atau ada yang ingin ditanyakan, silakan dikonfirmasi kepada admin.\n\n` +
      `Terima kasih atas kontribusi dan kerja samanya 🙏\n\n` +
      `_Wassalamu'alaikum warahmatullahi wabarakatuh_`

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
      Kirim WA
    </button>
  )
}
