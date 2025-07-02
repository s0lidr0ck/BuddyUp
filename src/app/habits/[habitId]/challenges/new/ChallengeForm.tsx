'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChallengeFormProps {
  habitId: string
  targetDay?: string // "Today" or "Tomorrow"
}

export default function ChallengeForm({ habitId, targetDay = "Today" }: ChallengeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('habitId', habitId)
      formData.append('title', title)
      formData.append('description', description)

      const response = await fetch('/api/challenges', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.challengeId) {
          router.push(`/challenges/${data.challengeId}`)
        } else {
          router.push('/dashboard')
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create challenge')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error creating challenge:', error)
      alert('Failed to create challenge')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            What's your specific goal for {targetDay.toLowerCase()}?
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="e.g., Do 20 push-ups, Read for 30 minutes, Meditate for 10 minutes"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Additional details (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            placeholder="Any specific notes, location, or requirements for this goal..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">💡 Goal-setting tips:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Be specific: "20 push-ups" vs "exercise"</li>
            <li>• Make it measurable: Include time, reps, or distance</li>
            <li>• Keep it achievable for today</li>
            <li>• Your buddy will see this and can help motivate you!</li>
          </ul>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '⏳ Creating...' : '🎯 Set Today\'s Goal'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
} 