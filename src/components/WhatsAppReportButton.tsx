'use client'

interface Lesson {
  id: string
  tanggalLes: string
  namaMurid: string
  namaWaliMurid: string
  whatsappWaliMurid: string | null
  biayaPerSiswa: number
  jumlahMurid: number
}

interface WhatsAppReportButtonProps {
  lessons: Lesson[]
  role: string
}

function formatRupiah(amount: number): string {
  if (amount >= 1000000) {
    const juta = amount / 1000000
    return `Rp${Number.isInteger(juta) ? juta : juta.toFixed(1)} jt`
  }
  return 'Rp' + amount.toLocaleString('id-ID')
}

function formatBulanTahun(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

function normalizeWa(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return '62' + digits
}

export default function WhatsAppReportButton({ lessons, role }: WhatsAppReportButtonProps) {
  if (role !== 'OWNER' || lessons.length === 0) return null

  // Kumpulkan unik pasangan (namaMurid, whatsappWaliMurid)
  const studentMap = new Map<string, { namaMurid: string; whatsappWaliMurid: string | null; lessons: Lesson[] }>()
  for (const l of lessons) {
    const key = l.namaMurid
    if (!studentMap.has(key)) {
      studentMap.set(key, { namaMurid: l.namaMurid, whatsappWaliMurid: l.whatsappWaliMurid, lessons: [] })
    }
    studentMap.get(key)!.lessons.push(l)
  }

  const students = Array.from(studentMap.values())
  const isSingleStudent = students.length === 1

  const buildMessage = (namaMurid: string, studentLessons: Lesson[], waPhone: string | null) => {
    const totalPertemuan = studentLessons.length
    const biayaPerSesi = studentLessons[0]?.biayaPerSiswa ?? 0
    const totalBiaya = totalPertemuan * biayaPerSesi

    // Periode
    const dates = studentLessons
      .map((l) => new Date(l.tanggalLes))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
    const periodeAwal = dates.length ? formatBulanTahun(dates[0].toISOString()) : '-'
    const periodeAkhir = dates.length ? formatBulanTahun(dates[dates.length - 1].toISOString()) : '-'
    const periode = periodeAwal === periodeAkhir ? periodeAwal : `${periodeAwal} - ${periodeAkhir}`

    const msg =
      `Assalamualaikum wr.wb Ayah/Bunda,\n` +
      `Mohon maaf izin mengganggu waktunya nggeh Ayah/Bunda. Saya ingin menyampaikan laporan kegiatan belajar dan rekap les Kakak *${namaMurid}* selama periode *${periode}* ini, berikut ringkasannya:\n\n` +
      `*Total pertemuan:*\n` +
      `${totalPertemuan} kali\n\n` +
      `*Per sesi:* ${formatRupiah(biayaPerSesi)}\n` +
      `*Total:*\n` +
      `${totalPertemuan} x ${formatRupiah(biayaPerSesi)} = *${formatRupiah(totalBiaya)}*\n\n` +
      `Pembayaran dapat dilakukan melalui:\n\n` +
      `MANDIRI (Rahayu Wiladatika)\n` +
      `1420023407165\n\n` +
      `DANA (Rahayu Wiladatika)\n` +
      `08817019549\n\n` +
      `SEABANK (Rahayu Wiladatika)\n` +
      `901254773451\n\n` +
      `Setelah melakukan pembayaran, mohon Ayah/Bunda mengirimkan konfirmasi nggeh.\n\n` +
      `Terima kasih banyak atas kerja sama dan kepercayaannya pada Kidemy. Semoga Kakak *${namaMurid}* selalu semangat dan makin berkembang dalam belajarnya.`

    return { msg, waPhone }
  }

  const handleSend = () => {
    if (isSingleStudent) {
      const { namaMurid, whatsappWaliMurid, lessons: sl } = students[0]
      const { msg, waPhone } = buildMessage(namaMurid, sl, whatsappWaliMurid)
      if (!waPhone) {
        alert(`Nomor WhatsApp wali murid ${namaMurid} belum tersedia.`)
        return
      }
      const url = `https://wa.me/${normalizeWa(waPhone)}?text=${encodeURIComponent(msg)}`
      window.open(url, '_blank')
    } else {
      // Multi student — buka semua, tapi batasi max 5 agar tidak spam popup
      const targets = students.filter((s) => s.whatsappWaliMurid)
      const missing = students.filter((s) => !s.whatsappWaliMurid)
      if (missing.length > 0) {
        alert(`Nomor WhatsApp belum tersedia untuk: ${missing.map((s) => s.namaMurid).join(', ')}.\nHanya siswa yang punya nomor WA yang akan dikirim.`)
      }
      if (targets.length === 0) return
      if (targets.length > 5) {
        const ok = confirm(`Akan membuka ${targets.length} tab WhatsApp sekaligus. Lanjutkan?`)
        if (!ok) return
      }
      for (const { namaMurid, whatsappWaliMurid, lessons: sl } of targets) {
        const { msg, waPhone } = buildMessage(namaMurid, sl, whatsappWaliMurid)
        if (!waPhone) continue
        const url = `https://wa.me/${normalizeWa(waPhone)}?text=${encodeURIComponent(msg)}`
        window.open(url, '_blank')
      }
    }
  }

  return (
    <button
      onClick={handleSend}
      title={isSingleStudent ? `Kirim laporan ke WA wali murid ${students[0].namaMurid}` : `Kirim laporan ke ${students.length} wali murid via WA`}
      className="inline-flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
      style={{
        background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
        boxShadow: '0 4px 15px rgba(37,211,102,0.30)',
      }}
    >
      {/* WhatsApp icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
      Kirim WA
    </button>
  )
}
