'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

interface PartnershipActionsProps {
  partnership: any
  onUpdate: () => void
}

export default function PartnershipActions({ partnership, onUpdate }: PartnershipActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  const handleViewChat = () => {
    router.push(`/partnerships/${partnership.id}/chat`)
  }

  const handleCreateHabit = () => {
    router.push(`/partnerships/${partnership.id}/habits/new`)
  }

  const handlePausePartnership = async () => {
    if (!confirm('Are you sure you want to pause this partnership? You can resume it later.')) {
      return
    }

    try {
      const response = await fetch(`/api/partnerships/${partnership.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED' })
      })

      if (response.ok) {
        addToast('Partnership paused successfully', 'success')
        onUpdate()
      } else {
        addToast('Failed to pause partnership', 'error')
      }
    } catch (error) {
      addToast('Something went wrong', 'error')
    }
  }

  const handleEndPartnership = async () => {
    if (!confirm('Are you sure you want to end this partnership? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/partnerships/${partnership.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      if (response.ok) {
        addToast('Partnership ended successfully', 'success')
        onUpdate()
      } else {
        addToast('Failed to end partnership', 'error')
      }
    } catch (error) {
      addToast('Something went wrong', 'error')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-3 py-1 text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
      >
        ⋯
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={handleViewChat}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                💬 View Chat
              </button>
              <button
                onClick={handleCreateHabit}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                🎯 Create New Habit
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handlePausePartnership}
                className="block w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
              >
                ⏸️ Pause Partnership
              </button>
              <button
                onClick={handleEndPartnership}
                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                ❌ End Partnership
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 