'use client'

import { useEffect, useState } from 'react'

export default function OwnerBackground() {
  const [mobileOpacity, setMobileOpacity] = useState(1)

  useEffect(() => {
    // Mobile: visible on load, starts fading after 1.5s, gone by 3s
    const fadeStart = setTimeout(() => setMobileOpacity(0), 1500)
    return () => clearTimeout(fadeStart)
  }, [])

  return (
    <>
      {/* Desktop only: always-on, very transparent background */}
      <div
        aria-hidden="true"
        className="hidden lg:block fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/image/bgowner.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.07,
          zIndex: 0,
        }}
      />

      {/* Mobile only: shows on load, fades out after 1.5s */}
      <div
        aria-hidden="true"
        className="lg:hidden fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/image/bgowner.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: mobileOpacity * 0.14,
          transition: 'opacity 1.2s ease-out',
          zIndex: 0,
        }}
      />
    </>
  )
}
