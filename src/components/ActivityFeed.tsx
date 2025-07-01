'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HabitApprovalButtons from './HabitApprovalButtons'

interface ActivityItem {
  id: string
  type: 'habit_approval' | 'habit_pending' | 'habit_declined' | 'buddy_invite' | 'goal_needed' | 'habit_approved'
  timestamp: Date
  priority: number // Lower = higher priority
  data: any
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  currentUserId: string
  enableSSE?: boolean // Optional: use Server-Sent Events instead of polling
}

export default function ActivityFeed({ activities: initialActivities, currentUserId, enableSSE = false }: ActivityFeedProps) {
  const router = useRouter()
  const [lastUpdateCheck, setLastUpdateCheck] = useState(Date.now())
  const [isConnected, setIsConnected] = useState(false)
  const [updateIndicator, setUpdateIndicator] = useState<string | null>(null)
  
  const handleUpdate = () => {
    router.refresh()
  }

  // Server-Sent Events implementation
  useEffect(() => {
    if (!enableSSE) return

    const eventSource = new EventSource('/api/dashboard/events')
    
    eventSource.onopen = () => {
      setIsConnected(true)
      console.log('Real-time connection established')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'connected':
            setIsConnected(true)
            break
          case 'update':
            setUpdateIndicator('New activity detected!')
            setTimeout(() => setUpdateIndicator(null), 3000)
            router.refresh()
            break
          case 'heartbeat':
            // Keep connection alive
            break
          case 'error':
            console.error('SSE Error:', data.error)
            break
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      console.log('Real-time connection lost, attempting to reconnect...')
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [enableSSE, router])

  // Polling implementation (fallback or default)
  useEffect(() => {
    if (enableSSE) return // Don't poll if using SSE

    const pollForUpdates = async () => {
      try {
        const response = await fetch(`/api/dashboard/updates?since=${lastUpdateCheck}`)
        if (response.ok) {
          const data = await response.json()
          if (data.hasUpdates) {
            setLastUpdateCheck(Date.now())
            setUpdateIndicator('Updates found!')
            setTimeout(() => setUpdateIndicator(null), 3000)
            router.refresh()
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error)
      }
    }

    const interval = setInterval(pollForUpdates, 10000) // Check every 10 seconds
    
    return () => clearInterval(interval)
  }, [lastUpdateCheck, router, enableSSE])

  // Update lastUpdateCheck when activities change
  useEffect(() => {
    setLastUpdateCheck(Date.now())
  }, [initialActivities])

  // Sort by priority first, then by timestamp (most recent first)
  const sortedActivities = initialActivities.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const renderActivityCard = (activity: ActivityItem) => {
    const { type, data, timestamp } = activity
    
    switch (type) {
      case 'habit_approval':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">👋</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {data.createdBy.name || data.createdBy.email} wants to start a habit with you!
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  "<strong>{data.name}</strong>" - {data.description || 'Ready to build this habit together?'}
                </p>
                <div className="flex items-center mb-3 space-x-4 text-sm text-gray-600">
                  <span>📅 {data.frequency}</span>
                  {data.category && <span>🏷️ {data.category}</span>}
                  {data.duration && <span>⏰ {data.duration} days</span>}
                </div>
                <HabitApprovalButtons habitId={data.id} onUpdate={handleUpdate} />
              </div>
            </div>
          </div>
        )

      case 'habit_pending':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-yellow-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-lg">⏳</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Waiting for {data.buddy.name || data.buddy.email} to approve
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  "<strong>{data.name}</strong>" - {data.description || 'You proposed this habit'}
                </p>
                <div className="flex items-center text-sm text-gray-600">
                  <span>📅 {data.frequency}</span>
                  {data.category && <span className="ml-4">🏷️ {data.category}</span>}
                  {data.duration && <span className="ml-4">⏰ {data.duration} days</span>}
                </div>
              </div>
            </div>
          </div>
        )

      case 'habit_declined':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-lg">❌</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {data.buddy.name || data.buddy.email} declined your habit
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  "<strong>{data.name}</strong>" - No worries, try suggesting something else!
                </p>
                <a
                  href={`/partnerships/${data.partnership.id}/habits/new`}
                  className="inline-flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  <span className="mr-2">↻</span>
                  Suggest a different habit
                </a>
              </div>
            </div>
          </div>
        )

      case 'buddy_invite':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-green-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">🤝</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {data.buddy.name || data.buddy.email} wants to be your buddy!
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  Ready to start building habits together and keep each other accountable?
                </p>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                    ✅ Accept
                  </button>
                  <button className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors">
                    ❌ Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'goal_needed':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-primary-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Ready to set today's goal?
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  Create today's challenge for "<strong>{data.name}</strong>" with {data.buddy.name || data.buddy.email}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    🔥 {data.streakCount} day streak
                  </div>
                  <a
                    href={`/habits/${data.id}/challenges/new`}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <span className="mr-2">🎯</span>
                    Set Today's Goal
                  </a>
                </div>
              </div>
            </div>
          </div>
        )

      case 'habit_approved':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-green-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">🎉</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {data.buddy.name || data.buddy.email} approved your habit!
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  "<strong>{data.name}</strong>" is now active - time to start building together! 🚀
                </p>
                <a
                  href={`/habits/${data.id}/challenge`}
                  className="inline-flex items-center text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  <span className="mr-2">🎯</span>
                  Create your first goal
                </a>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (sortedActivities.length === 0) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600 mb-6">
            No pending actions right now. Ready to create a new habit or invite a buddy?
          </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/habits/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span className="mr-2">🎯</span>
            Create Habit
          </a>
          <a
            href="/partnerships/invite"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="mr-2">👋</span>
            Invite Buddy
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {updateIndicator && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <span className="text-sm text-green-700">{updateIndicator}</span>
        </div>
      )}
      {sortedActivities.map(renderActivityCard)}
    </div>
  )
} 