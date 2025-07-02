'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/Toast'

interface AddBuddyModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddBuddyModal({ onClose, onSuccess }: AddBuddyModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addToast } = useToast()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      return
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverEmail: email.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        addToast('Buddy invitation sent successfully!', 'success')
        onSuccess()
        onClose()
      } else {
        if (data.error === 'User not found') {
          setErrors({ email: 'No user found with this email address' })
        } else if (data.error === 'Partnership already exists') {
          setErrors({ email: 'You already have a partnership with this user' })
        } else if (data.error === 'Cannot partner with yourself') {
          setErrors({ email: 'You cannot invite yourself as a buddy' })
        } else {
          addToast(data.error || 'Failed to send invitation', 'error')
        }
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Invite New Buddy</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your friend's email"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600">
              We'll send them an invitation to be your accountability buddy. 
              They'll need to create an account if they don't have one.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading || !email.trim()}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 