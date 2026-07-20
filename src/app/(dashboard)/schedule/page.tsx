'use client'

import { useState, useEffect, useCallback } from 'react'

interface Task {
  id: string
  title: string
  isCompleted: boolean
  date: string
}

interface Schedule {
  id: string
  title: string
  description: string | null
  date: string
  time: string
}

const timeSlots = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 PM',
  '06:15 AM', '07:15 AM', '08:15 AM', '09:15 AM', '10:15 PM',
  '06:30 AM', '07:30 AM', '08:30 AM', '09:30 PM', '10:30 PM',
  '06:45 AM', '07:45 AM', '08:45 AM', '09:45 PM', '10:45 PM',
]

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  // Form State untuk Task Baru
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Form State untuk Schedule Baru
  const [newScheduleTitle, setNewScheduleTitle] = useState('')
  const [newScheduleDesc, setNewScheduleDesc] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false)
  const [message, setMessage] = useState('')

  // Navigasi Bulan Kalender
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth()) // 0-11

  // Format string tanggal lokal YYYY-MM-DD
  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)
    return localDate.toISOString().split('T')[0]
  }

  const selectedDateStr = getLocalDateString(selectedDate)

  // Fetch Data (Tasks untuk tanggal terpilih, dan Semua Schedule guru)
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, schedulesRes] = await Promise.all([
        fetch(`/api/tasks?date=${selectedDateStr}`),
        fetch(`/api/schedules`),
      ])

      const tasksData = await tasksRes.json()
      const schedulesData = await schedulesRes.json()

      setTasks(tasksData.tasks || [])
      setSchedules(schedulesData.schedules || [])
    } catch (error) {
      console.error('Gagal mengambil data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDateStr])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Kalender Logic ---
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const startDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // --- CRUD Task ---
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          date: selectedDateStr,
        }),
      })

      if (res.ok) {
        setNewTaskTitle('')
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleTask = async (id: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      })

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isCompleted: !isCompleted } : t))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // --- CRUD Schedule ---
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScheduleTitle.trim() || !selectedTimeSlot) {
      setMessage('Judul dan Slot Waktu wajib dipilih!')
      return
    }

    setIsSubmittingSchedule(true)
    setMessage('')

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newScheduleTitle.trim(),
          description: newScheduleDesc.trim(),
          date: selectedDateStr,
          time: selectedTimeSlot,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setNewScheduleTitle('')
        setNewScheduleDesc('')
        setSelectedTimeSlot('')
        fetchData()
      } else {
        setMessage(data.error || 'Gagal menambahkan jadwal')
      }
    } catch (err) {
      console.error(err)
      setMessage('Terjadi kesalahan koneksi')
    } finally {
      setIsSubmittingSchedule(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Helper untuk memisahkan tanggal format ISO string ke UTC Date
  const parseISODate = (isoStr: string) => {
    const d = new Date(isoStr)
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000)
  }

  // Mengambil Acara Terdekat (Scheduled)
  const getNearestSchedule = () => {
    const now = new Date()
    const upcoming = schedules.filter((s) => {
      // Bandingkan datetime dari schedule dengan time sekarang
      const schedDate = parseISODate(s.date)
      
      // Ambil jam & menit dari string time
      let hours = 0
      let minutes = 0
      const matchAmPm = s.time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
      if (matchAmPm) {
        hours = parseInt(matchAmPm[1], 10)
        minutes = parseInt(matchAmPm[2], 10)
        const ampm = matchAmPm[3].toUpperCase()
        if (ampm === 'PM' && hours < 12) hours += 12
        if (ampm === 'AM' && hours === 12) hours = 0
      } else {
        const match24 = s.time.match(/^(\d+):(\d+)$/)
        if (match24) {
          hours = parseInt(match24[1], 10)
          minutes = parseInt(match24[2], 10)
        }
      }
      
      schedDate.setHours(hours, minutes, 0, 0)
      return schedDate.getTime() >= now.getTime()
    })

    return upcoming[0] || null
  }

  const nearestSchedule = getNearestSchedule()

  // Saring jadwal mendatang (selain yang terdekat)
  const upcomingEvents = nearestSchedule
    ? schedules.filter((s) => s.id !== nearestSchedule.id && parseISODate(s.date).getTime() >= new Date().setHours(0,0,0,0))
    : schedules.filter((s) => parseISODate(s.date).getTime() >= new Date().setHours(0,0,0,0))

  const totalDays = daysInMonth(currentMonth, currentYear)
  const firstDay = startDayOfMonth(currentMonth, currentYear)

  const calendarDays = []
  // Sel kosong untuk penyelarasan hari pertama bulan
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push(new Date(currentYear, currentMonth, i))
  }

  // Daftar warna gradasi premium untuk kartu list upcoming
  const cardGradients = [
    'from-amber-400/80 to-orange-500/80 text-white',
    'from-teal-400/80 to-emerald-500/80 text-white',
    'from-purple-400/80 to-indigo-500/80 text-white',
    'from-pink-400/80 to-rose-500/80 text-white',
  ]

  return (
    <div className="p-1.5 sm:p-4 md:p-6 bg-gray-50/50 min-h-screen">
      {/* Header Utama */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
            K Schedule
          </h1>
          <p className="text-xs text-gray-500 mt-1">Kelola agenda, rencana tugas harian, dan notifikasi jadwal mengajar Anda</p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm text-xs font-semibold text-gray-600">
          📍 Waktu Setempat: (UTC+07:00) Bangkok, Hanoi, Jakarta
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI & TENGAH (Lebar 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Baris Kalender & My Task */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Kalender */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <div className="flex gap-1.5">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 border border-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 border border-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Header Hari */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
              </div>

              {/* Grid Tanggal */}
              <div className="grid grid-cols-7 gap-1 text-center flex-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="p-2"></div>
                  }

                  const isSelected = getLocalDateString(day) === selectedDateStr
                  const isTodayStr = getLocalDateString(day) === getLocalDateString(new Date())

                  return (
                    <button
                      key={`day-${day.getDate()}`}
                      onClick={() => setSelectedDate(day)}
                      className={`p-2 text-xs rounded-xl font-medium transition-all duration-200 aspect-square flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-200'
                          : isTodayStr
                          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* My Task (Tugas Harian) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col max-h-[300px] md:max-h-none md:h-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  📝 Rencana Tugas
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                  {new Date(selectedDateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              {/* Form Input Task */}
              <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Tambahkan tugas baru..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-black transition-all"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </form>

              {/* List Tasks */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    Tidak ada tugas untuk hari ini
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-all text-xs"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleToggleTask(task.id, task.isCompleted)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all"
                        />
                        <span className={`truncate text-gray-800 ${task.isCompleted ? 'line-through text-gray-400' : 'font-medium'}`}>
                          {task.title}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors flex-shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Time Selector & Input Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5">
              ⏰ Pembuat Rencana Kegiatan & Jadwal
            </h3>
            <p className="text-[11px] text-gray-400 mb-4">Pilih salah satu slot waktu di bawah untuk menentukan jadwal secara cepat</p>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              {/* Grid Time Selector */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {timeSlots.map((slot) => {
                  const isActive = selectedTimeSlot === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2 text-[10px] sm:text-xs font-semibold rounded-xl border transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-100 font-bold'
                          : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>

              {/* Form Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Judul Agenda</label>
                  <input
                    type="text"
                    required
                    placeholder="Mengajar Matematika, Rapat, Persiapan Rencana Les dll..."
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Lokasi / Detail</label>
                  <input
                    type="text"
                    placeholder="Joyo Hotel, Kaliurang / Kelas Virtual / Cabang Utara"
                    value={newScheduleDesc}
                    onChange={(e) => setNewScheduleDesc(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white transition-all"
                  />
                </div>
              </div>

              {/* Tombol Simpan & Pesan */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-gray-50 pt-3">
                <div className="text-xs">
                  {selectedTimeSlot ? (
                    <span className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-xl">
                      Terpilih: {selectedTimeSlot} (Tanggal: {new Date(selectedDateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Harap pilih slot waktu di atas...</span>
                  )}
                  {message && <span className="text-red-500 font-medium block mt-1.5">{message}</span>}
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingSchedule ? (
                    'Menyimpan...'
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Simpan Jadwal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* KOLOM KANAN (Lebar 1/3) */}
        <div className="space-y-6">
          
          {/* Card Scheduled (Terdekat) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-800 tracking-tight">Scheduled (Terdekat)</h3>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            </div>

            {nearestSchedule ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-snug">{nearestSchedule.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Agenda Guru</p>
                </div>

                <div className="space-y-2 border-t border-b border-gray-50 py-3 text-xs text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {new Date(nearestSchedule.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Tanggal Acara</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{nearestSchedule.time}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Waktu Mulai (Pengingat -15 Menit)</p>
                    </div>
                  </div>

                  {nearestSchedule.description && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{nearestSchedule.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Lokasi / Detail</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteSchedule(nearestSchedule.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Batalkan Jadwal
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-gray-400">
                Belum ada jadwal mendatang terdekat
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[400px] lg:h-[450px]">
            <h3 className="text-sm font-bold text-gray-800 mb-3 tracking-tight">Upcoming Events</h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-20 text-xs text-gray-400">
                  Tidak ada acara mendatang lainnya
                </div>
              ) : (
                upcomingEvents.map((s, index) => {
                  const gradient = cardGradients[index % cardGradients.length]
                  return (
                    <div
                      key={s.id}
                      className={`p-4 rounded-2xl bg-gradient-to-r ${gradient} shadow-sm hover:shadow transition-all relative overflow-hidden group`}
                    >
                      {/* Dekorasi gelombang halus */}
                      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-2 translate-y-2 group-hover:scale-110 transition-all duration-300">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.25z"/></svg>
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm line-clamp-1">{s.title}</h4>
                          <p className="text-[10px] opacity-90 mt-1 flex items-center gap-1">
                            <span>🕒 {s.time}</span>
                            <span>•</span>
                            <span>📅 {new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          </p>
                          {s.description && (
                            <p className="text-[9px] opacity-80 mt-1 truncate">📍 {s.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(s.id)}
                          className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors flex-shrink-0"
                          title="Hapus Jadwal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
