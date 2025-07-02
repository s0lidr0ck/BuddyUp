'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
    name: string | null
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
          <div key={item.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              isCurrentUser 
                ? 'bg-primary-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <p className="text-sm">{item.data.content}</p>
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
          <div key={item.id} className="flex justify-center mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 text-lg mr-2">🎯</span>
                <span className="font-medium text-blue-900">New Habit Proposed</span>
              </div>
              <p className="text-blue-800 text-sm mb-2">
                <strong>{item.data.createdBy.name || item.data.createdBy.email}</strong> suggested:
              </p>
              <p className="font-semibold text-blue-900">"{item.data.name}"</p>
              {item.data.description && (
                <p className="text-blue-700 text-sm mt-1">{item.data.description}</p>
              )}
              <p className="text-xs text-blue-600 mt-2">{formatTimeAgo(item.timestamp)}</p>
            </div>
          </div>
        )

      case 'habit_approved':
        return (
          <div key={item.id} className="flex justify-center mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center mb-2">
                <span className="text-green-600 text-lg mr-2">🎉</span>
                <span className="font-medium text-green-900">Habit Approved!</span>
              </div>
              <p className="text-green-800 text-sm">
                Started working on "<strong>{item.data.name}</strong>" together
              </p>
              <p className="text-xs text-green-600 mt-2">{formatTimeAgo(item.timestamp)}</p>
            </div>
          </div>
        )

      case 'goal_set':
        return (
          <div key={item.id} className="flex justify-center mb-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center mb-2">
                <span className="text-purple-600 text-lg mr-2">🎯</span>
                <span className="font-medium text-purple-900">Goal Set</span>
              </div>
              <p className="text-purple-800 text-sm mb-2">
                <strong>{item.data.creator.name || item.data.creator.email}</strong> set today's goal:
              </p>
              <p className="font-semibold text-purple-900">"{item.data.title}"</p>
              {item.data.description && (
                <p className="text-purple-700 text-sm mt-1">{item.data.description}</p>
              )}
              <p className="text-xs text-purple-600 mt-2">{formatTimeAgo(item.timestamp)}</p>
            </div>
          </div>
        )

      case 'goal_completed':
        return (
          <div key={item.id} className="flex justify-center mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center mb-2">
                <span className="text-green-600 text-lg mr-2">✅</span>
                <span className="font-medium text-green-900">Goal Completed!</span>
              </div>
              <p className="text-green-800 text-sm mb-2">
                <strong>{item.data.user.name || item.data.user.email}</strong> completed:
              </p>
              <p className="font-semibold text-green-900">"{item.data.challenge.title}"</p>
              
              {item.data.reflectionNote && (
                <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                  <p className="text-green-800">💭 "{item.data.reflectionNote}"</p>
                </div>
              )}
              
              {item.data.feelingTags && (
                <div className="mt-2 flex flex-wrap gap-1">
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
              
              <p className="text-xs text-green-600 mt-2">{formatTimeAgo(item.timestamp)}</p>
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Timeline Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Your Journey Together!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              This is where you and {buddy.name || buddy.email} will track your progress, 
              share thoughts, and celebrate achievements together.
            </p>
            <button
              onClick={() => setMessage("Hey! Ready to start building some great habits together? 🚀")}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={sendMessage} className="flex space-x-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${buddy.name || buddy.email}...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
} 