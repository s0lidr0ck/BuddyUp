'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/Toast'

interface CopyInviteLinkProps {
  inviteCode: string
}

export default function CopyInviteLink({ inviteCode }: CopyInviteLinkProps) {
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()

  const handleCopy = async () => {
    try {
      const link = `${window.location.origin}/invite/${inviteCode}`
      await navigator.clipboard.writeText(link)
      setCopied(true)
      addToast('Invite link copied to clipboard!', 'success')
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      addToast('Failed to copy link. Please try again.', 'error')
    }
  }

  return (
    <div>
      <div className="bg-gray-50 rounded-lg p-4 border mb-3">
        <code className="text-sm text-gray-800 break-all">
          {`${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/invite/${inviteCode}`}
        </code>
      </div>
      <button 
        onClick={handleCopy}
        className={`px-4 py-2 rounded-lg transition-colors text-sm ${
          copied 
            ? 'bg-green-600 text-white' 
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {copied ? '✅ Copied!' : '📋 Copy Link'}
      </button>
    </div>
  )
} 