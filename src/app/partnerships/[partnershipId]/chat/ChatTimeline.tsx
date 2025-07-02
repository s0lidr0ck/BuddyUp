'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatUserName } from '@/lib/utils'

interface TimelineItem {
  id: string
  type: 'message' | 'habit_created' | 'habit_approved' | 'goal_set' | 'goal_completed'
  timestamp: Date
  data: any
}

interface ChatTimelineProps {
  partnershipId: string
  currentUserId: string
  buddy: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    image: string | null
  }
}

export default function ChatTimeline({ partnershipId, currentUserId, buddy }: ChatTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch timeline data
  useEffect(() => {
    fetchTimeline()
  }, [partnershipId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [timeline])

  // Real-time polling for new messages
  useEffect(() => {
    const pollForUpdates = async () => {
      if (!sending) { // Don't poll while sending to avoid conflicts
        await fetchTimeline()
      }
    }

    // Poll every 3 seconds for real-time updates
    const interval = setInterval(pollForUpdates, 3000)
    
    return () => clearInterval(interval)
  }, [partnershipId, sending])

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/partnerships/${partnershipId}/timeline`)
      if (response.ok) {
        const data = await response.json()
        const newTimeline = data.timeline || []
        
        // Only update if the timeline actually changed
        if (JSON.stringify(newTimeline) !== JSON.stringify(timeline)) {
          setTimeline(newTimeline)
          setLastUpdate(new Date())
        }
      }
    } catch (error) {
      console.error('Error fetching timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/partnerships/${partnershipId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      })

      if (response.ok) {
        setMessage('')
        fetchTimeline() // Refresh timeline
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return new Date(date).toLocaleDateString()
  }

  const renderTimelineItem = (item: TimelineItem) => {
    const isCurrentUser = item.data.senderId === currentUserId || 
                          item.data.creatorId === currentUserId ||
                          item.data.userId === currentUserId ||
                          item.data.createdById === currentUserId

    switch (item.type) {
      case 'message':
        return (
          <div key={item.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 px-2`}>
            <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
              isCurrentUser 
                ? 'bg-primary-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <p className="text-sm break-words">{item.data.content}</p>
              <p className={`text-xs mt-1 ${
                isCurrentUser ? 'text-primary-200' : 'text-gray-500'
              }`}>
                {formatTimeAgo(item.timestamp)}
              </p>
            </div>
          </div>
        )

      case 'habit_created':
        return (
          <div key={item.id} className="flex justify-center mb-6 px-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 w-full max-w-md">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 text-lg mr-2 flex-shrink-0">🎯</span>
                <span className="font-medium text-blue-900">New Habit Proposed</span>
              </div>
              <p className="text-blue-800 text-sm mb-2">
                <strong>{formatUserName(item.data.createdBy)}</strong> suggested:
              </p>
              <p className="font-semibold text-blue-900 break-words">"{item.data.name}"</p>
              {item.data.description && (
                <p className="text-blue-700 text-sm mt-1 break-words">{item.data.description}</p>
              )}
              <p className="text-xs text-blue-600 mt-2">{formatTimeAgo(item.timestamp)}</p>
            </div>
          </div>
        )

      case 'habit_approved':
        return (
          <div key={item.id} className="flex justify-center mb-6 px-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 w-full max-w-md">
              <div className="flex items-center mb-2">
                <span className="text-green-600 text-lg mr-2 flex-shrink-0">🎉</span>
                <span className="font-medium text-green-900">Habit Approved!</span>
              </div>
              <p className="text-green-800 text-sm break-words">
                Started working on "<strong>{item.data.name}</strong>" together
              </p>
              <p className="text-xs text-green-600 mt-2">{formatTimeAgo(item.timestamp)}</p>
            </div>
          </div>
        )

      case 'goal_set':
        return (
          <div key={item.id} className="flex justify-center mb-6 px-2">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 w-full max-w-md">
              <div className="flex items-center mb-2">
                <span className="text-purple-600 text-lg mr-2 flex-shrink-0">🎯</span>
                <span className="font-medium text-purple-900">Goal Set</span>
              </div>
              <p className="text-purple-800 text-sm mb-2">
                <strong>{item.data.creator.firstName || item.data.creator.email}</strong> set today's goal:
              </p>
              <p className="font-semibold text-purple-900 break-words mb-3">"{item.data.title}"</p>
              {item.data.description && (
                <p className="text-purple-700 text-sm mt-1 mb-3 break-words">{item.data.description}</p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-purple-600 flex-shrink-0">{formatTimeAgo(item.timestamp)}</p>
                <a
                  href={`/challenges/${item.data.id}`}
                  className="inline-flex items-center justify-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span className="mr-1">👁️</span>
                  View Goal
                </a>
              </div>
            </div>
          </div>
        )

      case 'goal_completed':
        return (
          <div key={item.id} className="flex justify-center mb-6 px-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 w-full max-w-md">
              <div className="flex items-center mb-2">
                <span className="text-green-600 text-lg mr-2 flex-shrink-0">✅</span>
                <span className="font-medium text-green-900">Goal Completed!</span>
              </div>
              <p className="text-green-800 text-sm mb-2">
                <strong>{item.data.user.firstName || item.data.user.email}</strong> completed:
              </p>
              <p className="font-semibold text-green-900 break-words mb-3">"{item.data.challenge.title}"</p>
              
              {item.data.reflectionNote && (
                <div className="mt-2 mb-3 p-2 bg-green-100 rounded text-sm">
                  <p className="text-green-800 break-words">💭 "{item.data.reflectionNote}"</p>
                </div>
              )}
              
              {item.data.feelingTags && (
                <div className="mt-2 mb-3 flex flex-wrap gap-1">
                  {(() => {
                    try {
                      const tags = JSON.parse(item.data.feelingTags)
                      return (
                        <>
                          {tags.difficulty && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {tags.difficulty.replace('_', ' ')}
                            </span>
                          )}
                          {tags.feeling && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              {tags.feeling}
                            </span>
                          )}
                        </>
                      )
                    } catch {
                      return null
                    }
                  })()}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-green-600 flex-shrink-0">{formatTimeAgo(item.timestamp)}</p>
                <a
                  href={`/challenges/${item.data.challenge.id}`}
                  className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span className="mr-1">👁️</span>
                  View Details
                </a>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your buddy timeline...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] relative">
      {/* Floating Close Button - Mobile Only */}
      <a
        href="/dashboard"
        className="fixed top-4 right-4 z-50 w-10 h-10 bg-white border border-gray-300 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors sm:hidden"
        aria-label="Close chat"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </a>

      {/* Timeline Messages */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl sm:text-2xl">👋</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Start Your Journey Together!
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md">
              This is where you and {formatUserName(buddy)} will track your progress, 
              share thoughts, and celebrate achievements together.
            </p>
            <button
              onClick={() => setMessage("Hey! Ready to start building some great habits together? 🚀")}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              Send First Message
            </button>
          </div>
        ) : (
          timeline.map(renderTimelineItem)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
        <form onSubmit={sendMessage} className="flex gap-2 sm:gap-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="px-4 sm:px-6 py-2 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
} 