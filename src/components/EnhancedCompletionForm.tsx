'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EnhancedCompletionFormProps {
  challengeId: string
}

const DIFFICULTY_OPTIONS = [
  { emoji: '😎', label: 'Easy', value: 'easy' },
  { emoji: '👍', label: 'Just Right', value: 'just_right' },
  { emoji: '💪', label: 'Hard', value: 'hard' },
  { emoji: '🤯', label: 'Impossible', value: 'impossible' }
]

const FEELING_OPTIONS = [
  { emoji: '🥱', label: 'Bored', value: 'bored' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '😪', label: 'Sleepy', value: 'sleepy' },
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '⚡', label: 'Energized', value: 'energized' },
  { emoji: '🎉', label: 'Excited', value: 'excited' }
]

export default function EnhancedCompletionForm({ challengeId }: EnhancedCompletionFormProps) {
  const router = useRouter()
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedFeeling, setSelectedFeeling] = useState<string>('')
  const [reflectionNote, setReflectionNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const selectDifficulty = (value: string) => {
    setSelectedDifficulty(selectedDifficulty === value ? '' : value)
  }

  const selectFeeling = (value: string) => {
    setSelectedFeeling(selectedFeeling === value ? '' : value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('challengeId', challengeId)
      formData.append('reflectionNote', reflectionNote)
      formData.append('feelingTags', JSON.stringify({
        difficulty: selectedDifficulty,
        feeling: selectedFeeling
      }))

      const response = await fetch('/api/challenges/complete', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        router.refresh()
      } else {
        console.error('Failed to complete challenge')
      }
    } catch (error) {
      console.error('Error completing challenge:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <h4 className='font-medium text-gray-900 mb-3'>How was it?</h4>
        <div className='grid grid-cols-2 gap-2'>
          {DIFFICULTY_OPTIONS.map(option => (
            <button
              key={option.value}
              type='button'
              onClick={() => selectDifficulty(option.value)}
              className={`p-3 rounded-lg border text-sm transition-all ${
                selectedDifficulty === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className='font-medium text-gray-900 mb-3'>How do you feel?</h4>
        <div className='grid grid-cols-2 gap-2'>
          {FEELING_OPTIONS.map(option => (
            <button
              key={option.value}
              type='button'
              onClick={() => selectFeeling(option.value)}
              className={`p-3 rounded-lg border text-sm transition-all ${
                selectedFeeling === option.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Reflection (optional)
        </label>
        <textarea
          value={reflectionNote}
          onChange={(e) => setReflectionNote(e.target.value)}
          placeholder='How did it go? Any thoughts or details...'
          rows={3}
          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm'
        />
      </div>
      
      <button
        type='submit'
        disabled={isSubmitting || !selectedDifficulty || !selectedFeeling}
        className='w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isSubmitting ? 'Completing...' : '✅ Complete Challenge'}
      </button>
    </form>
  )
}
