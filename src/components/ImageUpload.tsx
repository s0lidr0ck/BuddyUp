'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useToast } from './Toast'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  onUploadStart?: () => void
  currentImageUrl?: string
  folder?: string
  maxSize?: number // in MB
  acceptedTypes?: string[]
  className?: string
  children?: React.ReactNode
}

export default function ImageUpload({
  onUploadComplete,
  onUploadStart,
  currentImageUrl,
  folder = 'profile-pictures',
  maxSize = 5, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  children
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please upload: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`
    }

    // Check file size
    const sizeInMB = file.size / (1024 * 1024)
    if (sizeInMB > maxSize) {
      return `File too large. Maximum size is ${maxSize}MB`
    }

    return null
  }, [acceptedTypes, maxSize])

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      addToast(validationError, 'error')
      return
    }

    setUploading(true)
    onUploadStart?.()

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setPreview(data.url)
      onUploadComplete(data.url)
      addToast('Image uploaded successfully!', 'success')

    } catch (error) {
      console.error('Upload error:', error)
      addToast(error instanceof Error ? error.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }, [validateFile, folder, onUploadComplete, onUploadStart, addToast])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      uploadFile(files[0])
    }
  }, [uploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  const removeImage = useCallback(() => {
    setPreview(null)
    onUploadComplete('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onUploadComplete])

  if (children) {
    // Custom render with children
    return (
      <div className={className}>
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`cursor-pointer ${dragActive ? 'opacity-75' : ''}`}
        >
          {children}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview */}
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="text-primary-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm">Uploading...</p>
          </div>
        ) : (
          <div className="text-gray-600">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium">
              {dragActive ? 'Drop your image here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP up to {maxSize}MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 