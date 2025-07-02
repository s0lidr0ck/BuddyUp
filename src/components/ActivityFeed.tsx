'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HabitApprovalButtons from './HabitApprovalButtons'

interface ActivityItem {
  id: string
  type: 'habit_approval' | 'habit_pending' | 'habit_declined' | 'buddy_invite' | 'goal_needed' | 'goal_waiting' | 'challenge_completion' | 'challenges_completion' | 'habit_approved'
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
  
  // Helper function to format user display name
  const formatUserName = (user: any): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    } else if (user.firstName) {
      return user.firstName
    } else {
      return user.email
    }
  }

  // Helper function to render user avatar
  const renderUserAvatar = (user: any, size: string = 'w-10 h-10') => {
    if (user.profilePicture) {
      return (
        <img 
          src={user.profilePicture} 
          alt={`${formatUserName(user)}'s profile`}
          className={`${size} rounded-full object-cover`}
        />
      )
    } else {
      const initial = user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'
      return (
        <div className={`${size} bg-blue-100 rounded-full flex items-center justify-center`}>
          <span className="text-blue-600 text-lg font-medium">{initial}</span>
        </div>
      )
    }
  }
  
  const handleUpdate = () => {
    router.refresh()
  }

  const handleDismissDeclinedHabit = async (habitId: string) => {
    try {
      console.log('Dismissing habit:', habitId) // Debug log
      const response = await fetch(`/api/habits/${habitId}/dismiss`, {
        method: 'POST',
      })
      
      if (response.ok) {
        console.log('Habit dismissed successfully')
        router.refresh() // Refresh to remove the dismissed notification
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to dismiss habit notification:', errorData)
        
        // Show user-friendly error message
        if (response.status === 404) {
          alert('This notification is no longer available.')
        } else if (response.status === 403) {
          alert('You do not have permission to dismiss this notification.')
        } else {
          alert('Failed to dismiss notification. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error dismissing habit notification:', error)
      alert('Failed to dismiss notification. Please check your connection and try again.')
    }
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
              {renderUserAvatar(data.createdBy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {formatUserName(data.createdBy)} wants to start a habit with you!
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
              {renderUserAvatar(data.buddy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Waiting for {formatUserName(data.buddy)} to approve
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
              {renderUserAvatar(data.buddy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {formatUserName(data.buddy)} declined your habit
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  "<strong>{data.name}</strong>" - No worries, try suggesting something else!
                </p>
                <div className="flex items-center justify-between">
                  <a
                    href={`/partnerships/${data.partnership.id}/habits/new`}
                    className="inline-flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    <span className="mr-2">↻</span>
                    Suggest a different habit
                  </a>
                  <button
                    onClick={() => handleDismissDeclinedHabit(data.id)}
                    className="inline-flex items-center text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    <span className="mr-2">✕</span>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'buddy_invite':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-green-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              {renderUserAvatar(data.buddy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {formatUserName(data.buddy)} wants to be your buddy!
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
        const goalDay = data.isSettingTomorrow ? "tomorrow" : "today"
        const goalDayCapitalized = data.isSettingTomorrow ? "Tomorrow" : "Today"
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-primary-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              {renderUserAvatar(data.buddy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Ready to set {goalDay}'s goal?
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  Create {goalDay}'s challenge for "<strong>{data.name}</strong>" with {formatUserName(data.buddy)}
                  {data.isSettingTomorrow && <span className="text-green-600 font-medium"> • Great job completing today! 🎉</span>}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    🔥 {data.streakCount} day streak
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={`/partnerships/${data.partnershipId}/chat`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="mr-2">💬</span>
                      Chat
                    </a>
                    <a
                      href={`/habits/${data.id}/challenges/new`}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <span className="mr-2">🎯</span>
                      Set {goalDayCapitalized}'s Goal
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'goal_waiting':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              {renderUserAvatar(data.buddy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Waiting for {formatUserName(data.buddy)}
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  "<strong>{data.name}</strong>" - {formatUserName(data.buddy)}'s turn to set today's goal
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    🔥 {data.streakCount} day streak
                  </div>
                  <a
                    href={`/partnerships/${data.partnershipId}/chat`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="mr-2">💬</span>
                    Chat with {formatUserName(data.buddy)}
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
              {renderUserAvatar(data.buddy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {formatUserName(data.buddy)} approved your habit!
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

      case 'challenge_completion':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-purple-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              {renderUserAvatar(data.buddy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Complete today's challenge!
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-3">
                  "<strong>{data.title}</strong>" with {formatUserName(data.buddy)}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    🔥 {data.habit.streakCount} day streak
                  </div>
                  <a
                    href={`/challenges/${data.id}`}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <span className="mr-2">✅</span>
                    Complete Challenge
                  </a>
                </div>
              </div>
            </div>
          </div>
        )

      case 'challenges_completion':
        return (
          <div key={activity.id} className="bg-white rounded-lg border border-purple-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              {renderUserAvatar(data.buddy)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Your challenges with {formatUserName(data.buddy)}
                  </h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(timestamp)}</span>
                </div>
                
                {/* Challenge list with status indicators */}
                <div className="space-y-2 mb-4">
                  {data.challenges.map((challenge: any, index: number) => {
                    const today = new Date().toDateString()
                    const challengeDate = new Date(challenge.dueDate).toDateString()
                    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
                    
                    const isToday = challengeDate === today
                    const isTomorrow = challengeDate === tomorrow
                    const isFuture = new Date(challenge.dueDate) > new Date(tomorrow)
                    const isPast = new Date(challenge.dueDate) < new Date(today)
                    const isCompleted = challenge.userCompleted
                    
                    let statusColor = 'gray'
                    let statusIcon = '📅'
                    let statusText = 'Scheduled'
                    let canComplete = false
                    
                    if (isCompleted) {
                      statusColor = 'green'
                      statusIcon = '✅'
                      statusText = 'Completed'
                    } else if (isPast) {
                      statusColor = 'red'
                      statusIcon = '⏰'
                      statusText = 'Overdue'
                      canComplete = true
                    } else if (isToday) {
                      statusColor = 'yellow'
                      statusIcon = '🎯'
                      statusText = 'Due Today'
                      canComplete = true
                    } else if (isTomorrow) {
                      statusColor = 'blue'
                      statusIcon = '📅'
                      statusText = 'Tomorrow'
                    } else if (isFuture) {
                      statusColor = 'gray'
                      statusIcon = '🗓️'
                      statusText = new Date(challenge.dueDate).toLocaleDateString()
                    }
                    
                    return (
                      <div key={challenge.id} className={`flex items-center justify-between rounded-lg p-3 ${
                        statusColor === 'green' ? 'bg-green-50 border border-green-200' :
                        statusColor === 'red' ? 'bg-red-50 border border-red-200' :
                        statusColor === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
                        statusColor === 'blue' ? 'bg-blue-50 border border-blue-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{statusIcon}</span>
                            <span className="font-medium text-gray-900">"{challenge.title}"</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusColor === 'green' ? 'bg-green-100 text-green-800' :
                              statusColor === 'red' ? 'bg-red-100 text-red-800' :
                              statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {statusText}
                            </span>
                          </div>
                          {challenge.description && (
                            <p className="text-sm text-gray-600 ml-6">{challenge.description}</p>
                          )}
                        </div>
                        <div className="ml-3 flex space-x-2">
                          <a
                            href={`/challenges/${challenge.id}`}
                            className={`px-3 py-1 border text-sm rounded transition-colors ${
                              isCompleted 
                                ? 'border-green-600 text-green-600 hover:bg-green-50'
                                : canComplete
                                ? 'border-purple-600 text-purple-600 hover:bg-purple-50'
                                : 'border-gray-400 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {isCompleted ? 'View' : isFuture ? 'Preview' : 'View'}
                          </a>
                          {canComplete && !isCompleted && (
                            <a
                              href={`/challenges/${challenge.id}`}
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                            >
                              Complete
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    🔥 {data.streakCount} day streak • {data.challenges.length} challenge{data.challenges.length !== 1 ? 's' : ''}
                  </div>
                  <a
                    href={`/partnerships/${data.challenges[0]?.habit?.partnershipId}/chat`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="mr-2">💬</span>
                    Chat
                  </a>
                </div>
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