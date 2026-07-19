import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
})

const APP_NAME = 'Kidemy — Sistem Absensi Les Privat'
const APP_SHORT_NAME = 'Kidemy'
const APP_DESCRIPTION =
  'Platform manajemen absensi les privat untuk guru, orang tua, dan admin. Catat kehadiran siswa, kirim laporan otomatis ke wali murid via WhatsApp, dan pantau pendapatan guru secara real-time.'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_SHORT_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_SHORT_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'absensi les privat',
    'manajemen les privat',
    'sistem absensi siswa',
    'laporan les privat',
    'notifikasi whatsapp wali murid',
    'platform tutor',
    'kidemy',
    'absensi guru',
  ],
  authors: [{ name: 'Kidemy', url: APP_URL }],
  creator: 'Kidemy',
  publisher: 'Kidemy',
  robots: {
    index: false, // Aplikasi internal, tidak diindeks mesin pencari
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: APP_URL,
    siteName: APP_SHORT_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kidemy — Platform Absensi Les Privat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@kidemy',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  category: 'education',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1d4ed8' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={`${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  )
}
