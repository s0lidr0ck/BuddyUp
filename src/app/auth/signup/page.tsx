'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get invite context from URL
  const inviteCode = searchParams.get('invite')
  const inviterName = searchParams.get('from')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(result.message)
        // Redirect after a short delay to show success message
        setTimeout(() => {
          if (inviteCode) {
            // If they signed up through an invite, redirect to sign in and then to invite
            router.push(`/auth/signin?message=Account created! Sign in to accept your buddy invitation.&redirectTo=/invite/${inviteCode}`)
          } else {
            router.push('/auth/signin?message=Ready to sign in! Use your new password.')
          }
        }, 2000)
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <a 
            href="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
          >
            ← Back to home
          </a>
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <div className="h-8 w-8 bg-white rounded"></div>
            </div>
          </div>
          
          {inviteCode && inviterName ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Invited!</h1>
              <p className="text-gray-600">
                <span className="font-semibold">{decodeURIComponent(inviterName)}</span> wants to be your buddy on BuddyUp
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Create your account to connect and start building habits together
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join BuddyUp</h1>
              <p className="text-gray-600">
                Start your accountability journey today
              </p>
            </div>
          )}
        </div>

        {/* Invite Context Card */}
        {inviteCode && inviterName && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-primary-600 text-lg">👋</span>
              </div>
              <div>
                <p className="text-primary-800 font-medium text-sm">Buddy Invitation</p>
                <p className="text-primary-700 text-xs">
                  After creating your account, you'll be connected with {decodeURIComponent(inviterName)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="alex@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="At least 6 characters"
              />
              <p className="mt-1 text-xs text-gray-500">
                Choose a strong password with at least 6 characters
              </p>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">✅ {success}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {formData.email.includes('@') ? 'Checking account...' : 'Creating account...'}
                </div>
              ) : success ? (
                'Success! Redirecting...'
              ) : inviteCode ? (
                'Join BuddyUp & Accept Invitation'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a 
                href={inviteCode ? `/auth/signin?redirectTo=/invite/${inviteCode}` : "/auth/signin"} 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </a>
            </p>
          </div>

          {!inviteCode && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Smart Account System</h3>
                <p className="text-xs text-blue-800">
                  If you used magic links before, we'll upgrade your account to use password authentication for faster daily access!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 