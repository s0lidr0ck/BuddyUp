'use client'

import React from 'react'
import ImageUpload from './ImageUpload'

interface TaskPhotoUploadProps {
  onPhotoSelect: (url: string) => void
  currentPhoto?: string
  className?: string
}

export default function TaskPhotoUpload({ onPhotoSelect, currentPhoto, className }: TaskPhotoUploadProps) {
  return (
    <div className={className}>
      <ImageUpload
        currentImageUrl={currentPhoto}
        onUploadComplete={onPhotoSelect}
        folder="task-completions"
        maxSize={5} // 5MB for task photos
        className="max-w-sm mx-auto"
      />
      
      {currentPhoto && (
        <div className="mt-4 text-center">
          <img
            src={currentPhoto}
            alt="Task completion"
            className="max-w-full h-auto rounded-lg border border-gray-200 mx-auto max-h-64 object-cover"
          />
        </div>
      )}
    </div>
  )
} 