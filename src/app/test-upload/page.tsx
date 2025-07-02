'use client'

import { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'
import TaskPhotoUpload from '@/components/TaskPhotoUpload'

export default function TestUploadPage() {
  const [profilePicture, setProfilePicture] = useState('')
  const [taskPhoto, setTaskPhoto] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Component Test</h1>
        
        <div className="space-y-12">
          {/* Profile Picture Upload Test */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture Upload</h2>
            <p className="text-gray-600 mb-6">Test the profile picture upload component (3MB max, optimized to 400x400px)</p>
            
            <ImageUpload
              currentImageUrl={profilePicture}
              onUploadComplete={setProfilePicture}
              folder="profile-pictures"
              maxSize={3}
            />
            
            {profilePicture && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Uploaded URL:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block break-all">{profilePicture}</code>
              </div>
            )}
          </div>

          {/* Task Photo Upload Test */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Completion Photo</h2>
            <p className="text-gray-600 mb-6">Test the task photo upload component (5MB max, optimized to 800x600px)</p>
            
            <TaskPhotoUpload
              onPhotoSelect={setTaskPhoto}
              currentPhoto={taskPhoto}
            />
            
            {taskPhoto && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Uploaded URL:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block break-all">{taskPhoto}</code>
              </div>
            )}
          </div>

          {/* Custom Upload Test */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Upload Button</h2>
            <p className="text-gray-600 mb-6">Test with a custom upload trigger</p>
            
            <ImageUpload
              onUploadComplete={(url) => console.log('Custom upload:', url)}
              folder="test"
              className="inline-block"
            >
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                📎 Upload Custom File
              </button>
            </ImageUpload>
          </div>

          {/* Setup Status */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">S3 Setup Status</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">AWS Bucket: </span>
                <span className="text-green-600">✅ s-r-m</span>
              </div>
              <div>
                <span className="font-medium">AWS Region: </span>
                <span className="text-green-600">✅ us-east-1</span>
              </div>
              <div className="text-gray-600 mt-4">
                <p>✅ S3 is configured! Uploads will be saved to:</p>
                <code className="text-xs bg-gray-100 p-1 rounded">BuddyUp/users/[user-id]/media/</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 