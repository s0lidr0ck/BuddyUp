'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TaskPhotoUpload from '@/components/TaskPhotoUpload'

interface EnhancedCompletionFormProps {
  challengeId: string
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '💪', label: 'Strong', value: 'strong' },
  { emoji: '😌', label: 'Peaceful', value: 'peaceful' },
  { emoji: '🚀', label: 'Motivated', value: 'motivated' },
  { emoji: '😅', label: 'Challenged', value: 'challenged' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '😰', label: 'Stressed', value: 'stressed' },
  { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' }
]

const REFLECTION_PROMPTS = [
  "How did this challenge make you feel?",
  "What was the hardest part about completing this?",
  "What did you learn about yourself today?",
  "How will this help you tomorrow?",
  "What would you tell your buddy about this experience?"
]

export default function EnhancedCompletionForm({ challengeId }: EnhancedCompletionFormProps) {
  const router = useRouter()
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [reflectionNote, setReflectionNote] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState(REFLECTION_PROMPTS[0])
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'mood' | 'reflection' | 'photo' | 'summary'>('mood')

  const toggleMood = (moodValue: string) => {
    setSelectedMoods(prev => 
      prev.includes(moodValue) 
        ? prev.filter(m => m !== moodValue)
        : [...prev, moodValue]
    )
  }

  const handlePhotoUpload = (url: string) => {
    setPhotoUrl(url)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const payload = {
        challengeId,
        reflectionNote,
        feelingTags: JSON.stringify(selectedMoods),
        reflectionPrompt: selectedPrompt,
        photoUrl: photoUrl || undefined
      }

      const response = await fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  const canProceed = () => {
    switch (currentStep) {
      case 'mood': return selectedMoods.length > 0
      case 'reflection': return reflectionNote.trim().length > 0
      case 'photo': return true // Photo is optional
      case 'summary': return true
      default: return false
    }
  }

  const nextStep = () => {
    const steps: typeof currentStep[] = ['mood', 'reflection', 'photo', 'summary']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: typeof currentStep[] = ['mood', 'reflection', 'photo', 'summary']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {['mood', 'reflection', 'photo', 'summary'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step ? 'bg-green-600 text-white' :
              ['mood', 'reflection', 'photo', 'summary'].indexOf(currentStep) > index ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {index + 1}
            </div>
            {index < 3 && (
              <div className={`w-8 h-0.5 ${
                ['mood', 'reflection', 'photo', 'summary'].indexOf(currentStep) > index ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 'mood' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How are you feeling?</h3>
            <p className="text-gray-600 mb-6">Select all that apply</p>
            <div className="grid grid-cols-2 gap-3">
              {MOOD_OPTIONS.map(mood => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => toggleMood(mood.value)}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedMoods.includes(mood.value)
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{mood.emoji}</div>
                  <div className="text-sm font-medium">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'reflection' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reflect on your experience</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a prompt to guide your reflection:
              </label>
              <select
                value={selectedPrompt}
                onChange={(e) => setSelectedPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {REFLECTION_PROMPTS.map(prompt => (
                  <option key={prompt} value={prompt}>{prompt}</option>
                ))}
              </select>
            </div>
            <textarea
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder={selectedPrompt}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        )}

        {currentStep === 'photo' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add a photo (optional)</h3>
            <p className="text-gray-600 mb-6">Share a photo of your accomplishment or progress</p>
            
            <TaskPhotoUpload
              onPhotoSelect={handlePhotoUpload}
              currentPhoto={photoUrl}
            />
          </div>
        )}

        {currentStep === 'summary' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Mood:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedMoods.map(mood => {
                    const moodOption = MOOD_OPTIONS.find(m => m.value === mood)
                    return (
                      <span key={mood} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        {moodOption?.emoji} {moodOption?.label}
                      </span>
                    )
                  })}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Reflection:</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {reflectionNote || 'No reflection added'}
                </div>
              </div>
              
              {photoUrl && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Photo:</div>
                  <div className="text-sm text-green-600">📸 Photo attached</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 'mood'}
          className={`px-4 py-2 rounded-lg border ${
            currentStep === 'mood' 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Back
        </button>
        
        {currentStep === 'summary' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Completing...' : '✅ Complete Challenge'}
          </button>
        ) : (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceed()}
            className={`px-4 py-2 rounded-lg ${
              canProceed()
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
} 