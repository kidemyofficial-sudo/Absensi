'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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
  timeEnd: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HOUR_HEIGHT = 64 // px per hour in timeline
const TIMELINE_START_HOUR = 6  // 06:00
const TIMELINE_END_HOUR   = 22 // 22:00

const EVENT_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#14B8A6', // teal-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
]

const MONTH_NAMES = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]
const DAY_LABELS = ['Sen','Sel','Rab','Kam','Jum','Sab','Min']

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** YYYY-MM-DD using local timezone */
function toLocalDateStr(date: Date): string {
  const off = date.getTimezoneOffset()
  return new Date(date.getTime() - off * 60000).toISOString().split('T')[0]
}

/** Parse any time string to minutes since midnight */
function parseTimeToMinutes(t: string): number {
  if (!t) return 0
  const am = t.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (am) {
    let h = +am[1], m = +am[2]
    const p = am[3].toUpperCase()
    if (p === 'PM' && h < 12) h += 12
    if (p === 'AM' && h === 12) h = 0
    return h * 60 + m
  }
  const h24 = t.match(/^(\d+):(\d+)$/)
  if (h24) return +h24[1] * 60 + +h24[2]
  return 0
}

/** HH:MM → "9:30 AM" display */
function fmtTime(t: string): string {
  if (!t) return ''
  if (/AM|PM/i.test(t)) return t
  const m = t.match(/^(\d+):(\d+)$/)
  if (!m) return t
  let h = +m[1]
  const min = +m[2]
  const p = h >= 12 ? 'PM' : 'AM'
  h = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h}:${min.toString().padStart(2,'0')} ${p}`
}

/** Get Monday of the week containing date */
function getWeekStart(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1))
  r.setHours(0, 0, 0, 0)
  return r
}

/** Parse stored ISO date string back to local date */
function parseStoredDate(iso: string): Date {
  const d = new Date(iso)
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000)
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SchedulePage() {
  // Data
  const [tasks,     setTasks]     = useState<Task[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading,   setLoading]   = useState(true)

  // Calendar
  const [selectedDate,  setSelectedDate]  = useState(() => new Date())
  const [calYear,       setCalYear]       = useState(() => new Date().getFullYear())
  const [calMonth,      setCalMonth]      = useState(() => new Date().getMonth())

  // Timeline navigation
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [isFullscreen, setIsFullscreen] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Task form
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Create-schedule modal
  const [isModalOpen,      setIsModalOpen]      = useState(false)
  const [modalDate,        setModalDate]        = useState('')
  const [modalTimeStart,   setModalTimeStart]   = useState('09:00')
  const [modalTimeEnd,     setModalTimeEnd]     = useState('10:00')
  const [modalTitle,       setModalTitle]       = useState('')
  const [modalDesc,        setModalDesc]        = useState('')
  const [isSaving,         setIsSaving]         = useState(false)
  const [modalError,       setModalError]       = useState('')

  // Event-detail popup
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null)

  const selectedDateStr = toLocalDateStr(selectedDate)

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/tasks?date=${selectedDateStr}`),
        fetch('/api/schedules'),
      ])
      const td = await tRes.json()
      const sd = await sRes.json()
      setTasks(td.tasks || [])
      setSchedules(sd.schedules || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedDateStr])

  useEffect(() => { fetchData() }, [fetchData])

  // Scroll timeline to current hour on first render
  useEffect(() => {
    if (timelineRef.current) {
      const now = new Date()
      timelineRef.current.scrollTop =
        Math.max(0, now.getHours() - TIMELINE_START_HOUR - 1) * HOUR_HEIGHT
    }
  }, [])

  // ─── Calendar helpers ────────────────────────────────────────────────────────
  const daysInMonth  = (m: number, y: number) => new Date(y, m + 1, 0).getDate()
  const startWeekday = (m: number, y: number) => {
    const d = new Date(y, m, 1).getDay()
    return d === 0 ? 6 : d - 1 // Mon=0
  }

  // Build calendar grid
  const calGrid: (Date|null)[] = []
  for (let i = 0; i < startWeekday(calMonth, calYear); i++) calGrid.push(null)
  for (let i = 1; i <= daysInMonth(calMonth, calYear); i++) calGrid.push(new Date(calYear, calMonth, i))

  // ─── Open modal helpers ──────────────────────────────────────────────────────
  const openModal = (date: string, startTime = '09:00', endTime = '10:00') => {
    setModalDate(date)
    setModalTimeStart(startTime)
    setModalTimeEnd(endTime)
    setModalTitle('')
    setModalDesc('')
    setModalError('')
    setIsModalOpen(true)
  }

  const handleCalendarClick = (day: Date) => {
    setSelectedDate(day)
    openModal(toLocalDateStr(day))
  }

  // Click on empty area of timeline column → open modal at that time
  const handleTimelineColumnClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollTop = timelineRef.current?.scrollTop ?? 0
    const yInCol = e.clientY - rect.top + scrollTop
    const totalMinutes = TIMELINE_START_HOUR * 60 + (yInCol / HOUR_HEIGHT) * 60
    const hh = Math.min(Math.floor(totalMinutes / 60), TIMELINE_END_HOUR - 1)
    const mm = Math.round((totalMinutes % 60) / 15) * 15 // snap 15 min
    const start = `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`
    const endH = hh + 1 <= TIMELINE_END_HOUR ? hh + 1 : hh
    const end   = `${endH.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`
    openModal(toLocalDateStr(day), start, end)
  }

  // ─── CRUD Tasks ─────────────────────────────────────────────────────────────
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim(), date: selectedDateStr }),
      })
      if (r.ok) { setNewTaskTitle(''); fetchData() }
    } catch(err) { console.error(err) }
  }

  const toggleTask = async (id: string, done: boolean) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !done }),
      })
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !done } : t))
    } catch(err) { console.error(err) }
  }

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch(err) { console.error(err) }
  }

  // ─── CRUD Schedules ──────────────────────────────────────────────────────────
  const saveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalTitle.trim())    { setModalError('Judul agenda wajib diisi'); return }
    if (!modalTimeStart)       { setModalError('Jam mulai wajib diisi'); return }
    setIsSaving(true); setModalError('')
    try {
      const r = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: modalTitle.trim(),
          description: modalDesc.trim() || null,
          date: modalDate,
          time: modalTimeStart,
          timeEnd: modalTimeEnd || null,
        }),
      })
      const data = await r.json()
      if (r.ok) { setIsModalOpen(false); fetchData() }
      else setModalError(data.error || 'Gagal menyimpan jadwal')
    } catch {
      setModalError('Terjadi kesalahan koneksi')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
      setActiveSchedule(null)
      fetchData()
    } catch(err) { console.error(err) }
  }

  // ─── Schedule queries ────────────────────────────────────────────────────────
  const nearestSchedule = (() => {
    const now = new Date()
    return schedules.find(s => {
      const d = parseStoredDate(s.date)
      const mins = parseTimeToMinutes(s.time)
      d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
      return d.getTime() >= now.getTime()
    }) ?? null
  })()

  const upcomingEvents = schedules.filter(s => {
    if (nearestSchedule && s.id === nearestSchedule.id) return false
    return parseStoredDate(s.date).getTime() >= new Date().setHours(0,0,0,0)
  })

  // ─── Timeline layout ─────────────────────────────────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const timelineHours = Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR },
    (_, i) => TIMELINE_START_HOUR + i
  )

  const getSchedulesForDay = (day: Date) => {
    const str = toLocalDateStr(day)
    return schedules.filter(s => toLocalDateStr(parseStoredDate(s.date)) === str)
  }

  // Color per unique event id (deterministic)
  const colorForId = (id: string) =>
    EVENT_COLORS[parseInt(id.slice(-2), 16) % EVENT_COLORS.length]

  // Gradient pool for upcoming-events cards
  const GRADIENTS = [
    'from-amber-400/80 to-orange-500/80',
    'from-teal-400/80 to-emerald-500/80',
    'from-purple-400/80 to-indigo-500/80',
    'from-pink-400/80 to-rose-500/80',
  ]

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50/50 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block" />
            K Schedule
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Kelola agenda harian &amp; notifikasi jadwal mengajar Anda</p>
        </div>
        <button
          onClick={() => openModal(selectedDateStr)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Jadwal Baru
        </button>
      </div>

      {/* ── 3-col grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left+Center (2/3) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Calendar + My Task */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ── Calendar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-800">{MONTH_NAMES[calMonth]} {calYear}</h3>
                <div className="flex gap-1">
                  {[[-1,'M15 19l-7-7 7-7'],[1,'M9 5l7 7-7 7']].map(([dir, path]) => (
                    <button key={String(dir)}
                      onClick={() => {
                        const next = calMonth + (dir as number)
                        if (next < 0) { setCalMonth(11); setCalYear(y => y - 1) }
                        else if (next > 11) { setCalMonth(0); setCalYear(y => y + 1) }
                        else setCalMonth(next)
                      }}
                      className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 border border-gray-100 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={String(path)} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 gap-0.5 mb-1 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                {DAY_LABELS.map(d => <div key={d}>{d}</div>)}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {calGrid.map((day, idx) => {
                  if (!day) return <div key={`e-${idx}`} className="p-1.5" />
                  const dStr = toLocalDateStr(day)
                  const isSel   = dStr === selectedDateStr
                  const isToday = dStr === toLocalDateStr(new Date())
                  const hasEvt  = schedules.some(s => toLocalDateStr(parseStoredDate(s.date)) === dStr)
                  return (
                    <button key={`d-${day.getDate()}`}
                      onClick={() => handleCalendarClick(day)}
                      className={`p-1.5 text-[11px] rounded-lg font-medium transition-all duration-150 relative ${
                        isSel   ? 'bg-blue-600 text-white font-bold shadow-sm' :
                        isToday ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' :
                                  'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {day.getDate()}
                      {hasEvt && !isSel && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>

              <p className="mt-3 text-[10px] text-gray-400 text-center italic">
                Klik tanggal untuk membuat jadwal baru
              </p>
            </div>

            {/* ── My Task ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col" style={{ maxHeight: 300 }}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-800">📝 Rencana Tugas</h3>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                  {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              <form onSubmit={addTask} className="flex gap-2 mb-2">
                <input
                  type="text" placeholder="Tambahkan tugas baru..."
                  value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-black"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-1">
                {loading ? (
                  <div className="text-center py-6 text-xs text-gray-400">Memuat...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">Tidak ada tugas untuk hari ini</div>
                ) : tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl text-xs hover:bg-gray-100 transition-colors">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input type="checkbox" checked={t.isCompleted} onChange={() => toggleTask(t.id, t.isCompleted)}
                        className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded" />
                      <span className={`truncate ${t.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                        {t.title}
                      </span>
                    </label>
                    <button onClick={() => deleteTask(t.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Weekly Timeline ──────────────────────────────────────────────── */}
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 flex flex-col' : ''
          }`}>

            {/* Timeline toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-800">Timeline</h3>
                <span className="text-[10px] text-gray-400 hidden sm:block">
                  {weekDays[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  &nbsp;–&nbsp;
                  {weekDays[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setWeekStart(getWeekStart(new Date()))}
                  className="text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                  Hari Ini
                </button>
                {/* Prev/Next week */}
                {(['M15 19l-7-7 7-7', 'M9 5l7 7-7 7'] as const).map((path, dir) => (
                  <button key={path}
                    onClick={() => {
                      const d = new Date(weekStart)
                      d.setDate(d.getDate() + (dir === 0 ? -7 : 7))
                      setWeekStart(d)
                    }}
                    className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 border border-gray-100 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                    </svg>
                  </button>
                ))}
                {/* Full-screen toggle */}
                <button onClick={() => setIsFullscreen(f => !f)}
                  className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 border border-gray-100 transition-colors"
                  title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}>
                  {isFullscreen ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Day-header row (sticky) */}
            <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
              <div className="w-12 flex-shrink-0" /> {/* time-label gutter */}
              {weekDays.map((day, idx) => {
                const isToday = toLocalDateStr(day) === toLocalDateStr(new Date())
                const isSel   = toLocalDateStr(day) === selectedDateStr
                return (
                  <div key={idx} className="flex-1 text-center py-2 border-l border-gray-100 min-w-0">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase">{DAY_LABELS[idx]}</p>
                    <button
                      onClick={() => { setSelectedDate(day); openModal(toLocalDateStr(day)) }}
                      className={`w-7 h-7 rounded-full text-xs font-bold mx-auto mt-0.5 flex items-center justify-center transition-all ${
                        isToday ? 'bg-blue-600 text-white' :
                        isSel   ? 'bg-blue-100 text-blue-700' :
                                  'hover:bg-gray-100 text-gray-700'
                      }`}>
                      {day.getDate()}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Scrollable timeline body */}
            <div
              ref={timelineRef}
              className={`overflow-y-auto overflow-x-hidden flex-1 ${isFullscreen ? '' : 'h-[420px]'}`}
            >
              <div className="flex">
                {/* Hour labels */}
                <div className="w-12 flex-shrink-0">
                  {timelineHours.map(h => (
                    <div key={h} style={{ height: HOUR_HEIGHT }}
                      className="border-t border-gray-50 flex items-start justify-end pr-2 pt-1">
                      <span className="text-[8px] text-gray-400 font-medium">
                        {h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}
                      </span>
                    </div>
                  ))}
                  {/* Extra row at bottom */}
                  <div style={{ height: HOUR_HEIGHT }} className="border-t border-gray-50" />
                </div>

                {/* Day columns */}
                {weekDays.map((day, colIdx) => {
                  const dayEvts = getSchedulesForDay(day)
                  const totalH  = (timelineHours.length + 1) * HOUR_HEIGHT
                  const isToday = toLocalDateStr(day) === toLocalDateStr(new Date())

                  // Current-time position
                  const now = new Date()
                  const nowMins = now.getHours() * 60 + now.getMinutes()
                  const nowTop  = ((nowMins - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT

                  return (
                    <div key={colIdx}
                      className={`flex-1 relative border-l border-gray-100 cursor-pointer hover:bg-blue-50/20 transition-colors ${isToday ? 'bg-blue-50/10' : ''}`}
                      style={{ height: totalH }}
                      onClick={e => handleTimelineColumnClick(day, e)}
                    >
                      {/* Hour grid lines */}
                      {timelineHours.map((h, i) => (
                        <div key={h}
                          className={`absolute w-full border-t ${h % 2 === 0 ? 'border-gray-100' : 'border-gray-50'}`}
                          style={{ top: i * HOUR_HEIGHT }} />
                      ))}

                      {/* Now indicator */}
                      {isToday && nowTop >= 0 && nowTop < totalH && (
                        <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{ top: nowTop }}>
                          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 -ml-1" />
                          <div className="flex-1 h-px bg-red-400" />
                        </div>
                      )}

                      {/* Events */}
                      {dayEvts.map(evt => {
                        const startMin = parseTimeToMinutes(evt.time)
                        const endMin   = evt.timeEnd ? parseTimeToMinutes(evt.timeEnd) : startMin + 60
                        const top    = ((startMin - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT
                        const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 26)
                        const color  = colorForId(evt.id)
                        if (top < 0) return null
                        return (
                          <div key={evt.id}
                            onClick={e => { e.stopPropagation(); setActiveSchedule(evt) }}
                            className="absolute left-0.5 right-0.5 rounded-lg p-1.5 cursor-pointer hover:opacity-90 shadow-sm overflow-hidden z-10 transition-all hover:scale-[1.01]"
                            style={{ top, height, backgroundColor: color }}
                          >
                            <p className="text-[9px] sm:text-[10px] text-white font-bold truncate leading-tight">{evt.title}</p>
                            <p className="text-[8px] text-white/80 truncate hidden sm:block">
                              {fmtTime(evt.time)}{evt.timeEnd ? ` – ${fmtTime(evt.timeEnd)}` : ''}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {!isFullscreen && (
              <div className="px-4 py-2 border-t border-gray-50 text-[10px] text-gray-400 text-center">
                Klik area kosong pada kolom hari untuk membuat jadwal • Klik jadwal untuk lihat detail • 
                <button onClick={() => setIsFullscreen(true)} className="text-blue-500 hover:underline ml-1">Lihat layar penuh ↗</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-5">

          {/* ── Scheduled (nearest) ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-800">Scheduled (Terdekat)</h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-green-500" />
              </span>
            </div>

            {nearestSchedule ? (
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-snug">{nearestSchedule.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide font-semibold">Agenda Guru</p>
                </div>
                <div className="space-y-2 border-t border-b border-gray-50 py-3 text-xs">
                  {[
                    {
                      bg: 'bg-orange-50 text-orange-500',
                      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                      text: parseStoredDate(nearestSchedule.date).toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' }),
                      sub: 'Tanggal Acara',
                    },
                    {
                      bg: 'bg-blue-50 text-blue-500',
                      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                      text: `${fmtTime(nearestSchedule.time)}${nearestSchedule.timeEnd ? ` – ${fmtTime(nearestSchedule.timeEnd)}` : ''}`,
                      sub: 'Waktu (Notifikasi 15 mnt sebelumnya)',
                    },
                    ...(nearestSchedule.description ? [{
                      bg: 'bg-red-50 text-red-500',
                      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
                      text: nearestSchedule.description,
                      sub: 'Lokasi / Detail',
                    }] : []),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-6 h-6 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">{item.text}</p>
                        <p className="text-[10px] text-gray-400">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => deleteSchedule(nearestSchedule.id)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Batalkan Jadwal
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">Belum ada jadwal mendatang</div>
            )}
          </div>

          {/* ── Upcoming Events ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col" style={{ maxHeight: 380 }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-800">Upcoming Events</h3>
              {upcomingEvents.length > 0 && (
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                  {upcomingEvents.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-400">Tidak ada acara mendatang</div>
              ) : upcomingEvents.map((s, idx) => (
                <div key={s.id}
                  className={`p-3 rounded-xl bg-gradient-to-r ${GRADIENTS[idx % GRADIENTS.length]} text-white shadow-sm relative overflow-hidden cursor-pointer hover:opacity-95 transition-all`}
                  onClick={() => setActiveSchedule(s)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate">{s.title}</h4>
                      <p className="text-[9px] opacity-90 mt-0.5">
                        🕒 {fmtTime(s.time)}{s.timeEnd ? ` – ${fmtTime(s.timeEnd)}` : ''}
                        &nbsp;•&nbsp;
                        📅 {parseStoredDate(s.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
                      </p>
                      {s.description && (
                        <p className="text-[8px] opacity-80 mt-0.5 truncate">📍 {s.description}</p>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteSchedule(s.id) }}
                      className="p-0.5 rounded bg-white/20 hover:bg-white/30 text-white ml-1 flex-shrink-0 transition-colors">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          CREATE SCHEDULE MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-start">
              <div>
                <h2 className="text-base font-bold">📅 Buat Rencana Kegiatan</h2>
                <p className="text-blue-100 text-xs mt-0.5">Atur jadwal mengajar atau kegiatan harian Anda</p>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors mt-0.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={saveSchedule} className="p-6 space-y-4">

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tanggal</label>
                <input type="date" value={modalDate} onChange={e => setModalDate(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white" />
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jam Mulai</label>
                  <input type="time" value={modalTimeStart} onChange={e => setModalTimeStart(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jam Selesai</label>
                  <input type="time" value={modalTimeEnd} onChange={e => setModalTimeEnd(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white" />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Judul Agenda</label>
                <input type="text" required
                  placeholder="Mengajar Matematika, Rapat Guru, Persiapan Materi, dll..."
                  value={modalTitle} onChange={e => setModalTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white" />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Lokasi / Detail (Opsional)</label>
                <input type="text"
                  placeholder="Joyo Hotel, Kaliurang / Kelas Virtual / Rumah Murid"
                  value={modalDesc} onChange={e => setModalDesc(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white" />
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs font-medium">{modalError}</div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition-all disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          EVENT DETAIL POPUP
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeSchedule && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setActiveSchedule(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden"
            onClick={e => e.stopPropagation()}>

            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-4 text-white flex justify-between items-start">
              <div>
                <h2 className="text-base font-bold leading-snug pr-2">{activeSchedule.title}</h2>
                <p className="text-violet-200 text-xs mt-0.5">Detail Jadwal</p>
              </div>
              <button onClick={() => setActiveSchedule(null)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 flex-shrink-0 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              {[
                {
                  bg: 'bg-orange-50 text-orange-500',
                  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                  text: parseStoredDate(activeSchedule.date).toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
                  sub: 'Tanggal Acara',
                },
                {
                  bg: 'bg-blue-50 text-blue-500',
                  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                  text: `${fmtTime(activeSchedule.time)}${activeSchedule.timeEnd ? ` – ${fmtTime(activeSchedule.timeEnd)}` : ''}`,
                  sub: 'Waktu (Notifikasi 15 mnt sebelumnya)',
                },
                ...(activeSchedule.description ? [{
                  bg: 'bg-red-50 text-red-500',
                  icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
                  text: activeSchedule.description,
                  sub: 'Lokasi / Detail',
                }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 leading-snug">{item.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button onClick={() => setActiveSchedule(null)}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  Tutup
                </button>
                <button onClick={() => deleteSchedule(activeSchedule.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
