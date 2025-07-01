'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function InviteBuddyPage() {
  const [formData, setFormData] = useState({
    receiverEmail: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  // Fetch user's invite code
  useEffect(() => {
    const fetchInviteCode = async () => {
      try {
        const response = await fetch('/api/user/invite-code')
        if (response.ok) {
          const data = await response.json()
          setInviteCode(data.inviteCode)
        }
      } catch (err) {
        console.error('Failed to fetch invite code:', err)
      }
    }

    if (session?.user?.id) {
      fetchInviteCode()
    }
  }, [session])

  const handleCopyInviteCode = async () => {
    try {
      const inviteUrl = `${window.location.origin}/invite/${inviteCode}`
      await navigator.clipboard.writeText(inviteUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/partnerships/invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiverEmail: formData.receiverEmail,
          inviteCode: inviteCode 
        })
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess('Buddy invite sent! They\'ll get an email with a link to join you on BuddyUp.')
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setError(result.error || 'Failed to send invitation')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const habitCategories = [
    { value: 'FITNESS', label: '💪 Fitness & Exercise' },
    { value: 'HEALTH', label: '🏃 Health & Wellness' },
    { value: 'LEARNING', label: '📚 Learning & Education' },
    { value: 'PRODUCTIVITY', label: '⚡ Productivity' },
    { value: 'CREATIVITY', label: '🎨 Creativity' },
    { value: 'MINDFULNESS', label: '🧘 Mindfulness' },
    { value: 'SOCIAL', label: '👥 Social & Relationships' },
    { value: 'OTHER', label: '📝 Other' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a 
                href="/dashboard"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 mr-6"
              >
                ← Back to Dashboard
              </a>
              <h1 className="text-xl font-bold text-gray-900">Invite Your Buddy</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-primary-600 rounded"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Buddy</h2>
          <p className="text-gray-600">
            Connect with a friend and start building great habits together.
          </p>
        </div>

        {/* Your Invite Code Section */}
        {inviteCode && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🔗 Share Your Invite Link</h3>
            <p className="text-gray-600 text-sm mb-4">
              Share this link with friends through text, WhatsApp, or any other app. When they click it, they'll join BuddyUp and connect with you as buddies!
            </p>
            
            <div className="relative">
              <button
                onClick={handleCopyInviteCode}
                className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-100 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-primary-100 rounded-lg p-2 mr-3">
                      <span className="text-primary-600 text-lg">🔗</span>
                    </div>
                    <div className="text-left">
                      <div className="font-mono text-sm font-bold text-gray-900 break-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteCode}` : `buddyup.com/invite/${inviteCode}`}
                      </div>
                      <div className="text-sm text-gray-500">Click to copy your invite link</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {copySuccess ? (
                      <div className="flex items-center text-green-600">
                        <span className="mr-1">✅</span>
                        <span className="text-sm font-medium">Copied!</span>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Email Invite Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Or Send Email Invitation</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Buddy Email */}
            <div>
              <label htmlFor="receiverEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Friend's Email Address
              </label>
              <input
                id="receiverEmail"
                name="receiverEmail"
                type="email"
                required
                value={formData.receiverEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="friend@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll send them an email with your invite link. They can join BuddyUp and connect with you instantly!
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">✅</div>
                  <div>
                    <p className="text-green-800 font-medium">Invitation Sent!</p>
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">❌</div>
                  <div>
                    <p className="text-red-800 font-medium">Error</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Sending invitation...
                </div>
              ) : success ? (
                'Invitation Sent! Redirecting...'
              ) : (
                'Send Buddy Invitation'
              )}
            </button>
          </form>

          {/* How it Works */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-primary-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Connect as Buddies</h4>
                  <p className="text-gray-600 text-sm">Send a simple buddy invite. No specific habit commitment required yet.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-primary-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Choose Habits Together</h4>
                  <p className="text-gray-600 text-sm">Once connected, either of you can suggest new habits to work on together.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-primary-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Build & Grow</h4>
                  <p className="text-gray-600 text-sm">Add multiple habits over time and support each other's growth.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 