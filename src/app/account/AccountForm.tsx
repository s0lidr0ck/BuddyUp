'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import ImageUpload from '@/components/ImageUpload'

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  profilePicture: string | null
  username: string | null
  timezone: string
  reminderTime: string | null
}

interface AccountFormProps {
  user: User
}

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

export default function AccountForm({ user }: AccountFormProps) {
  const router = useRouter()
  const { addToast } = useToast()
  
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username || '',
    profilePicture: user.profilePicture || '',
    timezone: user.timezone,
    reminderTime: user.reminderTime || '',
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    if (formData.profilePicture && !isValidUrl(formData.profilePicture)) {
      newErrors.profilePicture = 'Please enter a valid URL'
    }

    if (formData.reminderTime && !isValidTime(formData.reminderTime)) {
      newErrors.reminderTime = 'Please enter a valid time (HH:mm format)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const isValidTime = (time: string) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        addToast('Profile updated successfully!', 'success')
        router.refresh()
      } else {
        const errorData = await response.json()
        addToast(errorData.error || 'Failed to update profile', 'error')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Profile</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`input ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`input ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`input ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Choose a unique username (optional)"
          />
          {errors.username && (
            <p className="text-red-600 text-sm mt-1">{errors.username}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            This will be used as your display name if provided
          </p>
        </div>

        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Profile Picture
          </label>
          
          <div className="space-y-4">
            {/* Image Upload Component */}
            <ImageUpload
              currentImageUrl={formData.profilePicture}
              onUploadComplete={(url) => {
                setFormData(prev => ({ ...prev, profilePicture: url }))
                // Clear any existing error
                if (errors.profilePicture) {
                  setErrors(prev => ({ ...prev, profilePicture: '' }))
                }
              }}
              folder="profile-pictures"
              maxSize={3} // 3MB for profile pictures
            />
            
            {/* Manual URL Input Option */}
            <div className="border-t pt-4">
              <label htmlFor="profilePictureUrl" className="block text-sm font-medium text-gray-600 mb-2">
                Or enter image URL manually
              </label>
              <input
                type="url"
                id="profilePictureUrl"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleInputChange}
                className={`input ${errors.profilePicture ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="https://example.com/your-photo.jpg"
              />
              {errors.profilePicture && (
                <p className="text-red-600 text-sm mt-1">{errors.profilePicture}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                You can upload an image above or provide a direct URL
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Preferences</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="input"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
                Daily Reminder Time
              </label>
              <input
                type="time"
                id="reminderTime"
                name="reminderTime"
                value={formData.reminderTime}
                onChange={handleInputChange}
                className={`input ${errors.reminderTime ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.reminderTime && (
                <p className="text-red-600 text-sm mt-1">{errors.reminderTime}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                When to remind you about your habits (optional)
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
} 