'use client'

interface RevenueRow {
  id: string
  biayaTotal: number
  pendapatanOwner: number
  pendapatanGuru: number
  lesson: {
    tanggalLes: string
    jenisPembelajaran: string
    namaGuru: string
    namaMurid: string
    jumlahMurid: number
  }
}

interface PendapatanPrintButtonProps {
  revenues: RevenueRow[]
  role: string
  userName: string
  bulan: string
  totalPendapatan: number
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export default function PendapatanPrintButton({
  revenues,
  role,
  userName,
  bulan,
  totalPendapatan,
}: PendapatanPrintButtonProps) {
  const handlePrint = () => {
    const isOwner = role === 'OWNER'

    const tableHeaders = isOwner
      ? `<th>Tanggal</th><th>Jenis Les</th><th>Guru</th><th>Murid</th><th>Jml Siswa</th><th>Total Biaya</th><th>Bagi Hasil Owner</th><th>Bagi Hasil Guru</th>`
      : `<th>Tanggal</th><th>Jenis Les</th><th>Murid</th><th>Jml Siswa</th><th>Salary</th>`

    const tableRows = revenues
      .map((r) => {
        if (isOwner) {
          return `
            <tr>
              <td>${formatDate(r.lesson.tanggalLes)}</td>
              <td>${r.lesson.jenisPembelajaran}</td>
              <td>${r.lesson.namaGuru}</td>
              <td>${r.lesson.namaMurid}</td>
              <td style="text-align:center">${r.lesson.jumlahMurid}</td>
              <td>${formatRupiah(r.biayaTotal)}</td>
              <td class="amount-owner">${formatRupiah(r.pendapatanOwner)}</td>
              <td class="amount-guru">${formatRupiah(r.pendapatanGuru)}</td>
            </tr>`
        } else {
          return `
            <tr>
              <td>${formatDate(r.lesson.tanggalLes)}</td>
              <td>${r.lesson.jenisPembelajaran}</td>
              <td>${r.lesson.namaMurid}</td>
              <td style="text-align:center">${r.lesson.jumlahMurid}</td>
              <td class="amount-guru">${formatRupiah(r.pendapatanGuru)}</td>
            </tr>`
        }
      })
      .join('')

    const totalLabel = isOwner ? 'Total Pendapatan Owner' : 'Total Salary'

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Pendapatan ${bulan} – Kidemy</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      color: #111827;
      background: #fff;
      padding: 32px 40px;
    }

    /* ── Header ─────────────────────────────── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand img {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      object-fit: cover;
    }

    .brand-text h1 {
      font-size: 22pt;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.5px;
      line-height: 1;
    }

    .brand-text p {
      font-size: 10pt;
      color: #2563eb;
      font-weight: 500;
      margin-top: 2px;
      letter-spacing: 0.3px;
    }

    .header-right {
      text-align: right;
    }

    .header-right h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #1e3a8a;
    }

    .header-right p {
      font-size: 9.5pt;
      color: #6b7280;
      margin-top: 3px;
    }

    /* ── Meta info ────────────────────────── */
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
      background: #f0f7ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }

    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 8pt; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 11pt; font-weight: 600; color: #111827; }

    /* ── Table ────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10pt;
    }

    thead tr {
      background: #1e3a8a;
    }

    thead th {
      color: #fff;
      font-weight: 600;
      padding: 10px 10px;
      text-align: left;
      font-size: 9pt;
      letter-spacing: 0.3px;
    }

    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #eff6ff; }

    tbody td {
      padding: 9px 10px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }

    .amount-owner { font-weight: 600; color: #1d4ed8; }
    .amount-guru  { font-weight: 600; color: #16a34a; }

    /* ── Total row ────────────────────────── */
    .total-row td {
      font-weight: 700;
      border-top: 2px solid #1e3a8a;
      border-bottom: none;
      background: #eff6ff;
      padding: 11px 10px;
      font-size: 11pt;
      color: #1e3a8a;
    }

    /* ── Footer ───────────────────────────── */
    .footer {
      margin-top: 32px;
      border-top: 1px solid #e5e7eb;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .footer-note {
      font-size: 8.5pt;
      color: #9ca3af;
    }

    .signature {
      text-align: center;
      font-size: 9.5pt;
    }

    .signature .sig-line {
      width: 160px;
      border-bottom: 1px solid #374151;
      margin: 48px auto 6px;
    }

    .signature p { color: #374151; font-weight: 500; }
    .signature small { color: #9ca3af; font-size: 8.5pt; }

    @media print {
      body { padding: 16px 20px; }
      @page { size: A4; margin: 12mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <img src="${window.location.origin}/image/kidemy logo.png" alt="Kidemy Logo" />
      <div class="brand-text">
        <h1>Kidemy</h1>
        <p>Learn and Grow</p>
      </div>
    </div>
    <div class="header-right">
      <h2>Laporan Pendapatan</h2>
      <p>Periode: ${bulan}</p>
      <p>Dicetak: ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p>
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Nama</span>
      <span class="meta-value">${userName}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Peran</span>
      <span class="meta-value">${role === 'OWNER' ? 'Owner / Admin' : 'Guru'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Periode</span>
      <span class="meta-value">${bulan}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Jumlah Les</span>
      <span class="meta-value">${revenues.length} sesi</span>
    </div>
  </div>

  <!-- Table -->
  <table>
    <thead>
      <tr>${tableHeaders}</tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#9ca3af">Belum ada data les bulan ini</td></tr>'}
      <tr class="total-row">
        <td colspan="${isOwner ? 6 : 4}">${totalLabel}</td>
        <td colspan="${isOwner ? 2 : 1}" class="${isOwner ? 'amount-owner' : 'amount-guru'}">${formatRupiah(totalPendapatan)}</td>
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
      <div class="sig-line"></div>
      <p>${role === 'OWNER' ? 'Tanda Tangan Owner' : 'Tanda Tangan Guru'}</p>
      <small>${userName}</small>
    </div>
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => window.print(), 400);
    };
  </script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
      </svg>
      Cetak PDF
    </button>
  )
}
