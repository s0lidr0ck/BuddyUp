import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BuddyUp - Accountability Made Simple',
  description: 'A friendly accountability platform that turns good intentions into daily reality—one trusted relationship at a time.',
  manifest: '/manifest.json',
  themeColor: '#0284c7',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BuddyUp',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'BuddyUp',
    title: 'BuddyUp - Accountability Made Simple',
    description: 'A friendly accountability platform that turns good intentions into daily reality—one trusted relationship at a time.',
  },
  twitter: {
    card: 'summary',
    title: 'BuddyUp - Accountability Made Simple',
    description: 'A friendly accountability platform that turns good intentions into daily reality—one trusted relationship at a time.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0284c7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BuddyUp" />
        <meta name="application-name" content="BuddyUp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0284c7" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 