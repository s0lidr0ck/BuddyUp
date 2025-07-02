'use client'

import React, { useState } from 'react'
import { useToast } from './Toast'

interface HabitApprovalButtonsProps {
  habitId: string
  onUpdate?: () => void
}

export default function HabitApprovalButtons({ habitId, onUpdate }: HabitApprovalButtonsProps) {
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleApproval = async (action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/habits/${habitId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Show success message
        const message = action === 'approve' 
          ? 'Habit approved! You can now start building together.'
          : 'Habit declined. Your buddy has been notified.'
        
        addToast(message, action === 'approve' ? 'success' : 'info')
        
        if (onUpdate) {
          onUpdate()
        } else {
          window.location.reload()
        }
      } else {
        const errorData = await response.json()
        addToast(errorData.error || 'Failed to process approval', 'error')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex space-x-2">
      <button 
        onClick={() => handleApproval('approve')}
        disabled={loading}
        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '...' : '✅ Approve & Start'}
      </button>
      <button 
        onClick={() => handleApproval('reject')}
        disabled={loading}
        className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '...' : '❌ Decline'}
      </button>
    </div>
  )
} 