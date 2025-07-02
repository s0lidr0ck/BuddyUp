'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from './Toast'
import { NotificationProvider } from './NotificationProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ToastProvider>
    </SessionProvider>
  )
} 