'use client'

interface Lesson {
  id: string
  tanggalLes: string
  namaGuru: string
  whatsappGuru: string
  jenisPembelajaran: string
  lokasiMengajar: string
  kelasMurid: string | null
  jumlahMurid: number
  namaMurid: string
  catatanMateri: string
  jamMulai: string
  jamSelesai: string
  namaWaliMurid: string
  whatsappWaliMurid: string | null
}

interface ReportsPrintButtonProps {
  lessons: Lesson[]
  userName: string
  role: string
}

export default function ReportsPrintButton({
  lessons,
  userName,
  role,
}: ReportsPrintButtonProps) {
  const handlePrint = () => {
    const tableRows = lessons
      .map(
        (l) => `
        <tr>
          <td>${new Date(l.tanggalLes).toLocaleDateString('id-ID')}</td>
          <td>${l.namaGuru}</td>
          <td>${l.jenisPembelajaran}</td>
          <td>${l.lokasiMengajar}</td>
          <td style="text-align:center">${l.kelasMurid || '-'}</td>
          <td style="text-align:center">${l.jumlahMurid}</td>
          <td>${l.namaMurid}</td>
          <td>${l.jamMulai} - ${l.jamSelesai}</td>
          <td>${l.namaWaliMurid}</td>
          <td class="catatan">${l.catatanMateri}</td>
        </tr>
      `
      )
      .join('')

    const printWindow = window.open('', '_blank', 'width=1100,height=700')
    if (!printWindow) return

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Rekap Laporan Les – Kidemy</title>
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
    }

    .brand img {
      height: 110px;
      object-fit: contain;
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
      font-size: 9pt;
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
    .meta-label { font-size: 7.5pt; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 10.5pt; font-weight: 600; color: #111827; }

    /* ── Table ────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 8.5pt;
    }

    thead tr {
      background: #1e3a8a;
    }

    thead th {
      color: #fff;
      font-weight: 600;
      padding: 8px 8px;
      text-align: left;
      font-size: 8.5pt;
      letter-spacing: 0.2px;
    }

    tbody tr:nth-child(even) { background: #f8fafc; }

    tbody td {
      padding: 8px 8px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
      vertical-align: top;
    }

    .catatan {
      max-width: 250px;
      word-wrap: break-word;
      white-space: pre-wrap;
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
      font-size: 8pt;
      color: #9ca3af;
    }

    .signature {
      text-align: center;
      font-size: 9pt;
    }

    .signature .sig-line {
      width: 160px;
      border-bottom: 1px solid #374151;
      margin: 40px auto 6px;
    }

    .signature p { color: #374151; font-weight: 500; }
    .signature small { color: #9ca3af; font-size: 8pt; }

    @media print {
      body { padding: 12px 15px; }
      @page { size: A4 landscape; margin: 10mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <img src="${window.location.origin}/image/kidemy logo.png" alt="Kidemy Logo" />
    </div>
    <div class="header-right">
      <h2>Rekap Laporan Kehadiran & Les</h2>
      <p>Dicetak: ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p>
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Nama Pencetak</span>
      <span class="meta-value">${userName}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Total Sesi Les</span>
      <span class="meta-value">${lessons.length} sesi</span>
    </div>
  </div>

  <!-- Table -->
  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th>Guru</th>
        <th>Jenis</th>
        <th>Lokasi</th>
        <th>Kelas</th>
        <th>Jml Murid</th>
        <th>Nama Murid</th>
        <th>Jam Les</th>
        <th>Wali Murid</th>
        <th>Catatan</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="10" style="text-align:center;padding:20px;color:#9ca3af">Tidak ada data laporan les</td></tr>'}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-note">
      <p>Dokumen ini dibuat secara otomatis oleh sistem Kidemy.</p>
    </div>
    <div class="signature">
      <div class="sig-line"></div>
      <p>Tanda Tangan Owner</p>
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

  // Tombol cetak PDF hanya untuk OWNER
  if (role !== 'OWNER') {
    return null
  }

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 text-sm font-medium transition-colors shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
      </svg>
      Cetak PDF
    </button>
  )
}
