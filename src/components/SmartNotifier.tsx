'use client'

import { useState, useEffect, useRef } from 'react'

interface Schedule {
  id: string
  title: string
  date: string
  time: string
  timeEnd: string | null
  category: string
  recurrence: string
}

export default function SmartNotifier() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const notifiedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission()
      setPermission(res)
    }
  }

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules')
      if (res.ok) {
        const data = await res.json()
        setSchedules(data.schedules || [])
      }
    } catch (err) {
      console.error('Failed to fetch schedules in background:', err)
    }
  }

  useEffect(() => {
    fetchSchedules()
    // Poll schedules every 5 minutes to stay in sync
    const pollInterval = setInterval(fetchSchedules, 5 * 60 * 1000)
    return () => clearInterval(pollInterval)
  }, [])

  // Check schedules every 1 minute
  useEffect(() => {
    const checkScheduleTimes = () => {
      if (permission !== 'granted') return

      const now = new Date()
      const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
      const todayWeekday = now.getDay()

      schedules.forEach(s => {
        // Only notify for teaching schedules (JADWAL)
        if (s.category !== 'JADWAL') return

        const [hours, minutes] = s.time.split(':').map(Number)
        const sDate = new Date(s.date)
        
        let matchesDay = false
        if (s.recurrence === 'WEEKLY') {
          matchesDay = sDate.getDay() === todayWeekday && sDate.getTime() <= now.getTime()
        } else {
          const sDateStr = sDate.getFullYear() + '-' + String(sDate.getMonth() + 1).padStart(2, '0') + '-' + String(sDate.getDate()).padStart(2, '0')
          matchesDay = sDateStr === todayStr
        }

        if (matchesDay) {
          const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0)
          const diffMs = targetTime.getTime() - now.getTime()
          const diffMins = diffMs / 60000

          // If starting in 8 to 12 minutes
          if (diffMins >= 8.0 && diffMins <= 12.0) {
            const notifyKey = `notified-${s.id}-${todayStr}`
            if (!notifiedKeysRef.current.has(notifyKey)) {
              notifiedKeysRef.current.add(notifyKey)
              
              // Trigger Browser Notification
              new Notification('⏰ Reminder Jadwal Mengajar', {
                body: `Sesi "${s.title}" akan dimulai dalam 10 menit (${s.time}). Bersiaplah!`,
                icon: '/favicon.ico',
              })
            }
          }
        }
      })
    }

    const checkInterval = setInterval(checkScheduleTimes, 60 * 1000)
    // Run immediate check
    checkScheduleTimes()

    return () => clearInterval(checkInterval)
  }, [schedules, permission])

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100/50" title="Notifikasi browser diblokir">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
        <span className="hidden md:inline">Notif Mati</span>
      </div>
    )
  }

  if (permission === 'default') {
    return (
      <button
        onClick={requestPermission}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm animate-pulse"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Aktifkan Notifikasi</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100/50" title="Notifikasi browser aktif">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="hidden md:inline">Notifikasi Aktif</span>
    </div>
  )
}
