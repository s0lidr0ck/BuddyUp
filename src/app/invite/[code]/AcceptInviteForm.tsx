'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AcceptInviteFormProps {
  inviterId: string
  inviterName: string
}

export function AcceptInviteForm({ inviterId, inviterName }: AcceptInviteFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleAcceptInvite = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/partnerships/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviterId })
      })

      const result = await response.json()

      if (response.ok) {
        // Redirect to dashboard with success message
        router.push('/dashboard?invited=true')
      } else {
        setError(result.error || 'Failed to accept invitation')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleAcceptInvite}
          disabled={isLoading}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Connecting...
            </div>
          ) : (
            `Accept & Become Buddies with ${inviterName}`
          )}
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 font-medium transition-colors"
        >
          Maybe Later
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By accepting, you'll be connected as buddies and can start building habits together.
        </p>
      </div>
    </div>
  )
} 