'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from './Toast'
import { NotificationSubscriptionData } from '@/lib/notifications-types'

interface NotificationContextType {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  requestPermission: () => Promise<boolean>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  unreadCount: number
  refreshUnreadCount: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { addToast } = useToast()
  
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [serviceWorkerReg, setServiceWorkerReg] = useState<ServiceWorkerRegistration | null>(null)

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  // Register service worker and check subscription status
  useEffect(() => {
    if (!isSupported || !session?.user?.id) return

    async function setupServiceWorker() {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js')
        setServiceWorkerReg(registration)

        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)

        console.log('Service Worker registered successfully for user:', session?.user?.id)
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        // Don't break the app if service worker fails - notifications just won't work
        setServiceWorkerReg(null)
        setIsSubscribed(false)
      }
    }

    // Add a small delay to ensure DOM is ready (helps on mobile)
    const timeoutId = setTimeout(setupServiceWorker, 100)
    
    return () => clearTimeout(timeoutId)
  }, [isSupported, session?.user?.id])

  // Handle page visibility changes (mobile app switching)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.id) {
        // App became visible again - refresh unread count
        console.log('App became visible - refreshing notification state')
        refreshUnreadCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session?.user?.id])

  // Get unread notification count
  const refreshUnreadCount = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const { count } = await response.json()
        setUnreadCount(count)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      refreshUnreadCount()
      
      // Poll for unread count every 30 seconds
      const interval = setInterval(refreshUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        addToast('Push notifications enabled! 🔔', 'success')
        return true
      } else if (result === 'denied') {
        addToast('Push notifications blocked. You can enable them in your browser settings.', 'warning')
      }
      
      return false
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  const subscribe = async (): Promise<boolean> => {
    console.log('🔔 Subscribe button clicked - starting subscription process')
    
    // Debug current state
    console.log('Current state:', {
      hasServiceWorker: !!serviceWorkerReg,
      hasSession: !!session?.user?.id,
      hasVAPID: !!VAPID_PUBLIC_KEY,
      currentPermission: permission,
      isSupported,
      userAgent: navigator.userAgent
    })

    if (!serviceWorkerReg || !session?.user?.id || !VAPID_PUBLIC_KEY) {
      const missingReqs = []
      if (!serviceWorkerReg) missingReqs.push('Service Worker')
      if (!session?.user?.id) missingReqs.push('User Session')
      if (!VAPID_PUBLIC_KEY) missingReqs.push('VAPID Key')
      
      console.error('❌ Cannot subscribe - missing:', missingReqs.join(', '))
      addToast(`Setup incomplete: Missing ${missingReqs.join(', ')}`, 'error')
      return false
    }

    try {
      console.log('📋 Checking permission...')
      
      // Request permission if not granted
      if (permission !== 'granted') {
        console.log('🔒 Permission not granted, requesting...')
        const granted = await requestPermission()
        if (!granted) {
          console.log('❌ Permission denied by user')
          return false
        }
        console.log('✅ Permission granted!')
      } else {
        console.log('✅ Permission already granted')
      }

      console.log('🔧 Creating push subscription...')
      
      // Subscribe to push notifications
      const subscription = await serviceWorkerReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      console.log('✅ Push subscription created:', subscription.endpoint)

      console.log('📡 Sending subscription to server...')
      
      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      })

      console.log('📡 Server response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Server saved subscription successfully:', result)
        setIsSubscribed(true)
        addToast('Successfully subscribed to push notifications! 🎉', 'success')
        return true
      } else {
        const error = await response.text()
        console.error('❌ Server error:', response.status, error)
        throw new Error(`Server error: ${response.status} - ${error}`)
      }
    } catch (error) {
      console.error('❌ Subscription failed:', error)
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('denied')) {
          addToast('Push notifications were blocked. Check your browser settings.', 'warning')
        } else if (error.message.includes('not supported')) {
          addToast('Push notifications are not supported on this browser.', 'error')
        } else if (error.message.includes('Server error')) {
          addToast('Server error - please try again later.', 'error')
        } else {
          addToast(`Failed to enable notifications: ${error.message}`, 'error')
        }
      } else {
        addToast('Failed to enable push notifications', 'error')
      }
      
      return false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    if (!serviceWorkerReg) return false

    try {
      const subscription = await serviceWorkerReg.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        // Note: We don't have an unsubscribe API endpoint yet, but the subscription is removed locally
        // In the future, you might want to notify the server to clean up the subscription record
      }

      setIsSubscribed(false)
      addToast('Unsubscribed from push notifications', 'info')
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      addToast('Failed to unsubscribe from push notifications', 'error')
      return false
    }
  }

  const value: NotificationContextType = {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    unreadCount,
    refreshUnreadCount
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
} 