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

const HOUR_HEIGHT = 68 // px per hour
const TIMELINE_START_HOUR = 6
const TIMELINE_END_HOUR = 22

const EVENT_COLORS = [
  { bg: 'bg-blue-50/90 border-blue-200 text-blue-700', raw: '#2563eb' },
  { bg: 'bg-emerald-50/90 border-emerald-200 text-emerald-700', raw: '#059669' },
  { bg: 'bg-purple-50/90 border-purple-200 text-purple-700', raw: '#7c3aed' },
  { bg: 'bg-amber-50/90 border-amber-200 text-amber-700', raw: '#d97706' },
  { bg: 'bg-rose-50/90 border-rose-200 text-rose-700', raw: '#e11d48' },
  { bg: 'bg-teal-50/90 border-teal-200 text-teal-700', raw: '#0d9488' },
  { bg: 'bg-sky-50/90 border-sky-200 text-sky-700', raw: '#0284c7' },
  { bg: 'bg-indigo-50/90 border-indigo-200 text-indigo-700', raw: '#4f46e5' },
]

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]
const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function toLocalDateStr(date: Date): string {
  const off = date.getTimezoneOffset()
  return new Date(date.getTime() - off * 60000).toISOString().split('T')[0]
}

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

function fmtTime(t: string): string {
  if (!t) return ''
  if (/AM|PM/i.test(t)) return t
  const m = t.match(/^(\d+):(\d+)$/)
  if (!m) return t
  let h = +m[1]
  const min = +m[2]
  const p = h >= 12 ? 'PM' : 'AM'
  h = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h}:${min.toString().padStart(2, '0')} ${p}`
}

function getWeekStart(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1))
  r.setHours(0, 0, 0, 0)
  return r
}

function parseStoredDate(iso: string): Date {
  const d = new Date(iso)
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000)
}

export default function SchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  // Calendar states
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())

  // Timeline states
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [isFullscreen, setIsFullscreen] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Task states
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Create modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState('')
  const [modalTimeStart, setModalTimeStart] = useState('09:00')
  const [modalTimeEnd, setModalTimeEnd] = useState('10:00')
  const [modalTitle, setModalTitle] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  // Detail popup state
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null)

  const selectedDateStr = toLocalDateStr(selectedDate)

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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (timelineRef.current) {
      const now = new Date()
      timelineRef.current.scrollTop =
        Math.max(0, now.getHours() - TIMELINE_START_HOUR - 1) * HOUR_HEIGHT
    }
  }, [])

  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate()
  const startWeekday = (m: number, y: number) => {
    const d = new Date(y, m, 1).getDay()
    return d === 0 ? 6 : d - 1
  }

  const calGrid: (Date | null)[] = []
  for (let i = 0; i < startWeekday(calMonth, calYear); i++) calGrid.push(null)
  for (let i = 1; i <= daysInMonth(calMonth, calYear); i++) calGrid.push(new Date(calYear, calMonth, i))

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

  const handleTimelineColumnClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scrollTop = timelineRef.current?.scrollTop ?? 0
    const yInCol = e.clientY - rect.top + scrollTop
    const totalMinutes = TIMELINE_START_HOUR * 60 + (yInCol / HOUR_HEIGHT) * 60
    const hh = Math.min(Math.floor(totalMinutes / 60), TIMELINE_END_HOUR - 1)
    const mm = Math.round((totalMinutes % 60) / 15) * 15
    const start = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
    const endH = hh + 1 <= TIMELINE_END_HOUR ? hh + 1 : hh
    const end = `${endH.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
    openModal(toLocalDateStr(day), start, end)
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim(), date: selectedDateStr }),
      })
      if (r.ok) {
        setNewTaskTitle('')
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleTask = async (id: string, done: boolean) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !done }),
      })
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !done } : t))
    } catch (err) {
      console.error(err)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const saveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalTitle.trim()) {
      setModalError('Judul agenda wajib diisi')
      return
    }
    if (!modalTimeStart) {
      setModalError('Jam mulai wajib diisi')
      return
    }
    setIsSaving(true)
    setModalError('')
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
      if (r.ok) {
        setIsModalOpen(false)
        fetchData()
      } else {
        setModalError(data.error || 'Gagal menyimpan jadwal')
      }
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
    } catch (err) {
      console.error(err)
    }
  }

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
    return parseStoredDate(s.date).getTime() >= new Date().setHours(0, 0, 0, 0)
  })

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

  const styleForId = (id: string) => {
    const idx = parseInt(id.slice(-2), 16) % EVENT_COLORS.length
    return EVENT_COLORS[idx]
  }

  const GRADIENTS = [
    'from-indigo-500/90 to-purple-500/90 shadow-[0_4px_12px_rgba(99,102,241,0.2)]',
    'from-blue-500/90 to-sky-500/90 shadow-[0_4px_12px_rgba(59,130,246,0.2)]',
    'from-emerald-500/90 to-teal-500/90 shadow-[0_4px_12px_rgba(16,185,129,0.2)]',
    'from-amber-500/90 to-orange-500/90 shadow-[0_4px_12px_rgba(245,158,11,0.2)]',
  ]

  return (
    <div className="pb-10">
      {/* Scrollbar overrides for clean custom interface */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">K Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Platform manajemen waktu belajar &amp; agenda harian Guru</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal(selectedDateStr)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-medium transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.3)] hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Jadwal Baru
          </button>
        </div>
      </div>

      {/* ── Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 2-Column Left Workspace */}
        <div className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Calendar widget */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900">{MONTH_NAMES[calMonth]} {calYear}</h3>
                <div className="flex items-center gap-1">
                  {[[-1, 'M15 19l-7-7 7-7'], [1, 'M9 5l7 7-7 7']].map(([dir, path]) => (
                    <button
                      key={String(dir)}
                      onClick={() => {
                        const next = calMonth + (dir as number)
                        if (next < 0) {
                          setCalMonth(11)
                          setCalYear(y => y - 1)
                        } else if (next > 11) {
                          setCalMonth(0)
                          setCalYear(y => y + 1)
                        } else {
                          setCalMonth(next)
                        }
                      }}
                      className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={String(path)} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
                {DAY_LABELS.map(d => <div key={d}>{d}</div>)}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calGrid.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="p-2" />
                  const dStr = toLocalDateStr(day)
                  const isSel = dStr === selectedDateStr
                  const isToday = dStr === toLocalDateStr(new Date())
                  const hasEvt = schedules.some(s => toLocalDateStr(parseStoredDate(s.date)) === dStr)

                  return (
                    <button
                      key={`day-${day.getDate()}`}
                      onClick={() => handleCalendarClick(day)}
                      className={`p-2 text-xs font-semibold rounded-xl relative flex items-center justify-center transition-all ${
                        isSel
                          ? 'bg-blue-600 text-white shadow-sm'
                          : isToday
                          ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {day.getDate()}
                      {hasEvt && !isSel && (
                        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Daily Tasks widget */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ maxHeight: 290 }}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Rencana Tugas</h3>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              <form onSubmit={addTask} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Tambahkan tugas hari ini..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50 focus:bg-white text-gray-900 transition-all"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-all shadow-sm flex-shrink-0"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="text-center py-6 text-xs text-gray-400 font-medium">Memuat tugas...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 font-medium italic">Tidak ada tugas hari ini</div>
                ) : (
                  tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100/50 transition-colors text-xs">
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={t.isCompleted}
                          onChange={() => toggleTask(t.id, t.isCompleted)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500/20"
                        />
                        <span className={`truncate text-gray-800 ${t.isCompleted ? 'line-through text-gray-400 font-normal' : 'font-semibold'}`}>
                          {t.title}
                        </span>
                      </label>
                      <button onClick={() => deleteTask(t.id)} className="text-gray-400 hover:text-red-500 p-0.5 transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Timeline widget */}
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 bg-white' : ''
          }`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Timeline Jadwal</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                    {weekDays[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    &nbsp;–&nbsp;
                    {weekDays[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekStart(getWeekStart(new Date()))}
                  className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                >
                  Hari Ini
                </button>
                <div className="flex border border-gray-100 rounded-xl overflow-hidden">
                  {(['M15 19l-7-7 7-7', 'M9 5l7 7-7 7'] as const).map((path, dir) => (
                    <button
                      key={path}
                      onClick={() => {
                        const d = new Date(weekStart)
                        d.setDate(d.getDate() + (dir === 0 ? -7 : 7))
                        setWeekStart(d)
                      }}
                      className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 border-r border-gray-100 last:border-0 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                      </svg>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsFullscreen(f => !f)}
                  className="p-2 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-colors"
                  title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                >
                  {isFullscreen ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Day headers column layout */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
              <div className="w-14 flex-shrink-0" />
              {weekDays.map((day, idx) => {
                const isToday = toLocalDateStr(day) === toLocalDateStr(new Date())
                const isSel = toLocalDateStr(day) === selectedDateStr

                return (
                  <div key={idx} className="flex-1 text-center py-3 border-l border-gray-100 min-w-0">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">{DAY_LABELS[idx]}</p>
                    <button
                      onClick={() => {
                        setSelectedDate(day)
                        openModal(toLocalDateStr(day))
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold mx-auto mt-1 flex items-center justify-center transition-all ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-[0_4px_10px_rgba(59,130,246,0.3)]'
                          : isSel
                          ? 'bg-blue-50 text-blue-600 font-extrabold'
                          : 'hover:bg-gray-150/50 text-gray-700'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Scrollable grid area */}
            <div
              ref={timelineRef}
              className={`overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar ${isFullscreen ? '' : 'h-[400px]'}`}
            >
              <div className="flex relative">
                {/* Hours labels on gutter */}
                <div className="w-14 flex-shrink-0 bg-white">
                  {timelineHours.map(h => (
                    <div
                      key={h}
                      style={{ height: HOUR_HEIGHT }}
                      className="border-t border-gray-50 flex items-start justify-end pr-3 pt-1"
                    >
                      <span className="text-[9px] text-gray-400 font-semibold tracking-wider">
                        {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                      </span>
                    </div>
                  ))}
                  <div style={{ height: HOUR_HEIGHT }} className="border-t border-gray-50" />
                </div>

                {/* Day Columns */}
                {weekDays.map((day, colIdx) => {
                  const dayEvts = getSchedulesForDay(day)
                  const totalH = (timelineHours.length + 1) * HOUR_HEIGHT
                  const isToday = toLocalDateStr(day) === toLocalDateStr(new Date())

                  const now = new Date()
                  const nowMins = now.getHours() * 60 + now.getMinutes()
                  const nowTop = ((nowMins - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT

                  return (
                    <div
                      key={colIdx}
                      className={`flex-1 relative border-l border-gray-100 cursor-pointer hover:bg-indigo-50/10 transition-colors ${
                        isToday ? 'bg-blue-50/10' : ''
                      }`}
                      style={{ height: totalH }}
                      onClick={e => handleTimelineColumnClick(day, e)}
                    >
                      {/* Grid lines */}
                      {timelineHours.map((h, i) => (
                        <div
                          key={h}
                          className={`absolute w-full border-t ${h % 2 === 0 ? 'border-gray-150/70' : 'border-gray-50'}`}
                          style={{ top: i * HOUR_HEIGHT }}
                        />
                      ))}

                      {/* Current time horizontal indicator */}
                      {isToday && nowTop >= 0 && nowTop < totalH && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{ top: nowTop }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] flex-shrink-0 -ml-1.5" />
                          <div className="flex-1 h-px bg-red-400" />
                        </div>
                      )}

                      {/* Event Cards inside timeline */}
                      {dayEvts.map(evt => {
                        const startMin = parseTimeToMinutes(evt.time)
                        const endMin = evt.timeEnd ? parseTimeToMinutes(evt.timeEnd) : startMin + 60
                        const top = ((startMin - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT
                        const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 32)
                        const style = styleForId(evt.id)
                        if (top < 0) return null

                        return (
                          <div
                            key={evt.id}
                            onClick={e => {
                              e.stopPropagation()
                              setActiveSchedule(evt)
                            }}
                            className={`absolute left-1 right-1 rounded-xl p-2 cursor-pointer shadow-sm border border-l-4 overflow-hidden z-10 transition-all hover:scale-[1.01] hover:shadow-md ${style.bg}`}
                            style={{ top, height, borderLeftColor: style.raw }}
                          >
                            <p className="text-[10px] font-bold truncate leading-tight tracking-tight">{evt.title}</p>
                            <p className="text-[8px] font-semibold mt-0.5 truncate opacity-90 hidden sm:block">
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
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-[10px] text-gray-400 text-center font-medium">
                Klik area kosong pada kolom hari untuk membuat rencana kegiatan • Klik jadwal untuk edit
              </div>
            )}
          </div>
        </div>

        {/* Right Column Workspace */}
        <div className="space-y-6">

          {/* ── Scheduled (Nearest) ── */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Scheduled (Terdekat)</h3>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
            </div>

            {nearestSchedule ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-snug">{nearestSchedule.title}</h4>
                  <p className="text-[9px] text-blue-600 mt-1 uppercase tracking-wider font-extrabold">Agenda Guru</p>
                </div>
                <div className="space-y-3 border-t border-b border-gray-100/80 py-4 text-xs text-gray-600">
                  {[
                    {
                      bg: 'bg-orange-50 text-orange-600',
                      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                      text: parseStoredDate(nearestSchedule.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
                      sub: 'Tanggal Acara',
                    },
                    {
                      bg: 'bg-blue-50 text-blue-600',
                      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                      text: `${fmtTime(nearestSchedule.time)}${nearestSchedule.timeEnd ? ` – ${fmtTime(nearestSchedule.timeEnd)}` : ''}`,
                      sub: 'Waktu (Notifikasi 15 mnt sebelumnya)',
                    },
                    ...(nearestSchedule.description ? [{
                      bg: 'bg-red-50 text-red-600',
                      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
                      text: nearestSchedule.description,
                      sub: 'Lokasi / Detail',
                    }] : []),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 leading-none">{item.text}</p>
                        <p className="text-[9px] text-gray-400 mt-1">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => deleteSchedule(nearestSchedule.id)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Batalkan Jadwal
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 font-medium italic">Belum ada agenda terdekat</div>
            )}
          </div>

          {/* ── Upcoming Events ── */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ maxHeight: 380 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Events</h3>
              {upcomingEvents.length > 0 && (
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-bold">
                  {upcomingEvents.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-20 text-xs text-gray-400 font-medium italic">Tidak ada acara mendatang</div>
              ) : (
                upcomingEvents.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl bg-gradient-to-r ${GRADIENTS[idx % GRADIENTS.length]} text-white shadow-sm relative overflow-hidden cursor-pointer hover:shadow hover:scale-[1.01] transition-all`}
                    onClick={() => setActiveSchedule(s)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm truncate">{s.title}</h4>
                        <p className="text-[10px] opacity-90 mt-1 font-medium">
                          🕒 {fmtTime(s.time)}{s.timeEnd ? ` – ${fmtTime(s.timeEnd)}` : ''}
                          &nbsp;•&nbsp;
                          📅 {parseStoredDate(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                        {s.description && (
                          <p className="text-[9px] opacity-80 mt-1 truncate">📍 {s.description}</p>
                        )}
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteSchedule(s.id)
                        }}
                        className="p-1 rounded bg-white/20 hover:bg-white/30 text-white ml-1 flex-shrink-0 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modal Create ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-150 overflow-hidden hover:scale-[1.005] transition-transform duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white flex justify-between items-start">
              <div>
                <h2 className="text-base font-semibold tracking-tight">📅 Buat Rencana Kegiatan</h2>
                <p className="text-blue-100 text-xs mt-0.5">Atur jadwal belajar atau agenda personal Anda</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors mt-0.5"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={saveSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tanggal</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={modalTimeStart}
                    onChange={e => setModalTimeStart(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={modalTimeEnd}
                    onChange={e => setModalTimeEnd(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Judul Agenda</label>
                <input
                  type="text"
                  required
                  placeholder="Mengajar Matematika, Persiapan Materi, dll..."
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Lokasi / Detail (Opsional)</label>
                <input
                  type="text"
                  placeholder="Joyo Hotel, Kaliurang / Rumah Murid"
                  value={modalDesc}
                  onChange={e => setModalDesc(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 bg-white"
                />
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-semibold">{modalError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Detail ── */}
      {activeSchedule && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setActiveSchedule(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-gray-150 overflow-hidden hover:scale-[1.005] transition-transform duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 text-white flex justify-between items-start">
              <div>
                <h2 className="text-base font-semibold pr-2 leading-snug tracking-tight">{activeSchedule.title}</h2>
                <p className="text-indigo-100 text-xs mt-0.5">Detail Rencana Jadwal</p>
              </div>
              <button
                onClick={() => setActiveSchedule(null)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 flex-shrink-0 transition-colors mt-0.5"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              {[
                {
                  bg: 'bg-orange-50 text-orange-600',
                  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                  text: parseStoredDate(activeSchedule.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                  sub: 'Tanggal Acara',
                },
                {
                  bg: 'bg-blue-50 text-blue-600',
                  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                  text: `${fmtTime(activeSchedule.time)}${activeSchedule.timeEnd ? ` – ${fmtTime(activeSchedule.timeEnd)}` : ''}`,
                  sub: 'Waktu (Notifikasi 15 mnt sebelumnya)',
                },
                ...(activeSchedule.description ? [{
                  bg: 'bg-rose-50 text-rose-600',
                  icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
                  text: activeSchedule.description,
                  sub: 'Lokasi / Detail',
                }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className={`w-8 h-8 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 leading-snug">{item.text}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{item.sub}</p>
                  </div>
                </div>
              ))}

              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveSchedule(null)}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={() => deleteSchedule(activeSchedule.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
