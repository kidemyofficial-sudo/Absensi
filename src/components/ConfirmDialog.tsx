'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const iconConfig = {
    danger:  { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)' },
    warning: { bg: 'rgba(245,158,11,0.12)',  color: '#d97706', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    info:    { bg: 'rgba(99,102,241,0.12)',   color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  }
  const cfg = iconConfig[variant]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,10,40,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <style>{`
        @keyframes dialog-in {
          from { opacity: 0; transform: scale(0.94) translateY(-10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
      <div
        className="max-w-sm w-full overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(99,102,241,0.20)',
          animation: 'dialog-in 0.2s ease-out both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7">
          {/* Icon */}
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: cfg.bg, width: '52px', height: '52px' }}
          >
            {variant === 'danger' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            )}
            {variant === 'warning' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
            {variant === 'info' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            )}
          </div>

          <h3 className="text-base font-bold mb-2" style={{ color: '#1e1b4b' }}>{title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-7 pb-7">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1"
            style={{ padding: '0.6rem 1rem' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-semibold text-sm text-white rounded-xl transition-all"
            style={{
              background: cfg.gradient,
              padding: '0.6rem 1rem',
              boxShadow: `0 4px 15px ${cfg.bg}`,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
