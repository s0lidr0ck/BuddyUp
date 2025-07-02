'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatUserName } from '@/lib/utils'

export default function ChooseBuddyPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [partnerships, setPartnerships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPartnerships = async () => {
      try {
        const response = await fetch('/api/partnerships')
        if (response.ok) {
          const data = await response.json()
          setPartnerships(data.partnerships.filter((p: any) => p.status === 'ACTIVE'))
        }
      } catch (error) {
        console.error('Error loading partnerships:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPartnerships()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your buddies...</p>
        </div>
      </div>
    )
  }

  if (partnerships.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Buddies Yet</h1>
            <p className="text-gray-600 mb-6">
              You need at least one buddy to create habits. Find someone to help you stay accountable!
            </p>
            <a
              href="/partnerships/invite"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <span className="mr-2">👋</span>
              Find Your First Buddy
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (partnerships.length === 1) {
    // If only one partnership, redirect directly to habit creation
    router.push(`/partnerships/${partnerships[0].id}/habits/new`)
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Buddy</h1>
          <p className="text-gray-600">
            Which buddy do you want to build this habit with?
          </p>
        </div>

        <div className="space-y-4">
          {partnerships.map((partnership: any) => {
            const buddy = partnership.initiatorId === session?.user?.id 
              ? partnership.receiver 
              : partnership.initiator

            const activeHabits = partnership.habits?.filter((h: any) => h.status === 'ACTIVE') || []

            return (
              <div 
                key={partnership.id}
                onClick={() => router.push(`/partnerships/${partnership.id}/habits/new`)}
                className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {formatUserName(buddy)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {activeHabits.length === 0 
                          ? 'No habits yet - time to start!'
                          : `${activeHabits.length} active habit${activeHabits.length > 1 ? 's' : ''} together`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-primary-600 font-medium">Choose →</div>
                  </div>
                </div>

                {/* Show recent habits if any */}
                {activeHabits.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {activeHabits.slice(0, 3).map((habit: any) => (
                        <span 
                          key={habit.id}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {habit.name}
                        </span>
                      ))}
                      {activeHabits.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{activeHabits.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/partnerships/invite"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <span className="mr-2">👋</span>
            Invite Another Buddy
          </a>
        </div>
      </div>
    </div>
  )
} 