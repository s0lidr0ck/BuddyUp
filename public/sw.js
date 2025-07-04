// Service Worker for BuddyUp PWA
// Handles push notifications, background sync, and offline capabilities

const CACHE_NAME = 'buddyup-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/buddies',
  '/account',
  '/manifest.json'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip caching for API routes and external URLs
  if (event.request.url.includes('/api/') || !event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // If network fails, try to return a fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
          throw new Error('Network error and no cache available')
        })
      })
      .catch((error) => {
        console.log('Service Worker fetch error:', error)
        // Return a basic response for navigation requests when everything fails
        if (event.request.mode === 'navigate') {
          return new Response('App is offline. Please check your connection.', {
            headers: { 'Content-Type': 'text/html' }
          })
        }
        return Response.error()
      })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  let notificationData = {}
  
  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (e) {
      notificationData = {
        title: 'BuddyUp',
        body: event.data.text() || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
      }
    }
  }

  const {
    title = 'BuddyUp',
    body = 'You have a new notification',
    icon = '/icons/icon-192x192.png',
    badge = '/icons/badge-72x72.png',
    tag = 'default',
    url = '/dashboard',
    actions = [],
    data = {}
  } = notificationData

  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    data: { url, ...data },
    requireInteraction: false,
    actions: actions.slice(0, 2), // Limit to 2 actions per notification
    vibrate: [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  const url = event.notification.data?.url || '/dashboard'
  
  // Handle action button clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Open the specific URL
        break
      case 'complete':
        // Handle completion action
        fetch('/api/notifications/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'complete',
            notificationId: event.notification.data?.notificationId 
          })
        })
        return
      case 'dismiss':
        // Just close notification
        return
    }
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if app not open
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'notification-read') {
    event.waitUntil(syncNotificationRead())
  }
})

// Sync notification read status when back online
async function syncNotificationRead() {
  try {
    // Get pending notification reads from IndexedDB
    const pendingReads = await getPendingNotificationReads()
    
    for (const read of pendingReads) {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: read.notificationId })
      })
    }
    
    // Clear pending reads
    await clearPendingNotificationReads()
  } catch (error) {
    console.error('Failed to sync notification reads:', error)
  }
}

// Helper functions for IndexedDB operations
async function getPendingNotificationReads() {
  // Implement IndexedDB read operations
  return []
}

async function clearPendingNotificationReads() {
  // Implement IndexedDB clear operations
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
}) 