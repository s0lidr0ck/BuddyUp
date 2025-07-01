'use client'

import React, { useEffect, useState } from 'react'

interface ConnectionStatusProps {
  enableSSE?: boolean
}

export default function ConnectionStatus({ enableSSE = false }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enableSSE) return

    const eventSource = new EventSource('/api/dashboard/events')
    
    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [enableSSE])

  if (!enableSSE) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <span className="text-xs text-gray-500">Auto-refresh</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
      <span className="text-xs text-gray-500">
        {isConnected ? 'Live' : 'Connecting...'}
      </span>
    </div>
  )
} 