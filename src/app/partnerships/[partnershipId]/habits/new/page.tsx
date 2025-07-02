'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/Toast'
import { formatUserName } from '@/lib/utils'

const HABIT_CATEGORIES = [
  { id: 'Faith', name: 'Faith', emoji: '🙏', description: 'Spiritual growth and practices' },
  { id: 'Fitness', name: 'Fitness/Health', emoji: '💪', description: 'Physical wellness and exercise' },
  { id: 'Learning', name: 'Learning', emoji: '📚', description: 'Education and skill development' },
  { id: 'Productivity', name: 'Productivity', emoji: '⚡', description: 'Getting things done efficiently' },
  { id: 'Relationships', name: 'Relationships', emoji: '❤️', description: 'Connecting with others' },
  { id: 'Personal', name: 'Personal', emoji: '🌟', description: 'Self-improvement and growth' },
]

const FREQUENCY_OPTIONS = [
  { id: 'DAILY', name: 'Daily', description: 'Every single day' },
  { id: 'WEEKDAYS', name: 'Weekdays', description: 'Monday through Friday' },
  { id: 'WEEKENDS', name: 'Weekends', description: 'Saturday and Sunday' },
  { id: 'CUSTOM', name: 'Custom', description: 'Choose specific days' },
]

const DURATION_OPTIONS = [
  { id: 'ongoing', name: 'Ongoing', description: 'No end date - build it for life!', value: null },
  { id: '7', name: '1 Week', description: 'Quick habit test', value: 7 },
  { id: '14', name: '2 Weeks', description: 'Build momentum', value: 14 },
  { id: '30', name: '1 Month', description: 'Solid foundation', value: 30 },
  { id: '66', name: '66 Days', description: 'Scientific habit formation', value: 66 },
  { id: '90', name: '90 Days', description: 'Lifestyle transformation', value: 90 },
  { id: 'custom', name: 'Custom', description: 'Set your own timeline', value: 'custom' },
]

export default function NewHabitPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { addToast } = useToast()
  const [partnership, setPartnership] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    frequency: 'DAILY',
    duration: 'ongoing',
    customDuration: ''
  })

  // Load partnership data
  useEffect(() => {
    const loadPartnership = async () => {
      try {
        const response = await fetch(`/api/partnerships/${params.partnershipId}`)
        if (response.ok) {
          const data = await response.json()
          setPartnership(data.partnership)
        }
      } catch (error) {
        console.error('Error loading partnership:', error)
      }
    }

    if (params.partnershipId) {
      loadPartnership()
    }
  }, [params.partnershipId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.category) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // Calculate duration
      let duration = null
      if (formData.duration === 'custom') {
        duration = parseInt(formData.customDuration)
        if (!duration || duration < 7) {
          setError('Custom duration must be at least 7 days')
          setLoading(false)
          return
        }
      } else if (formData.duration !== 'ongoing') {
        duration = parseInt(formData.duration)
      }

      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          frequency: formData.frequency,
          duration,
          partnershipId: params.partnershipId,
        }),
      })

      if (response.ok) {
        // Show success message and redirect
        addToast('Habit created! Your buddy will need to approve it before you can start building together.', 'success')
        router.push('/dashboard')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create habit')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const buddy = partnership && session?.user?.id
    ? (partnership.initiatorId === session.user.id ? partnership.receiver : partnership.initiator)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Habit</h1>
          {buddy && (
            <p className="text-gray-600">
              You and <span className="font-medium">{formatUserName(buddy)}</span> will work on this together!
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Habit Name */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              What habit do you want to build? *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Read for 20 minutes, Do 50 push-ups, Pray for 10 minutes"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Category Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-900 mb-4">
              Choose a category *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {HABIT_CATEGORIES.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.category === category.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    checked={formData.category === category.id}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="sr-only"
                  />
                  <div className="text-2xl mr-3">{category.emoji}</div>
                  <div>
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-600">{category.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-900 mb-4">
              How often? (We recommend daily for best results!)
            </label>
            <div className="space-y-3">
              {FREQUENCY_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.frequency === option.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={option.id}
                    checked={formData.frequency === option.id}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="sr-only"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.name}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-900 mb-4">
              How long do you want to commit?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DURATION_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.duration === option.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={option.id}
                    checked={formData.duration === option.id}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="sr-only"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.name}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Duration Input */}
            {formData.duration === 'custom' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of days (minimum 7)
                </label>
                <input
                  type="number"
                  min="7"
                  value={formData.customDuration}
                  onChange={(e) => setFormData({ ...formData, customDuration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter number of days"
                />
              </div>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Add details (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Any specific details about your habit, goals, or motivation..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Habit...' : 'Create Habit & Start Building!'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 