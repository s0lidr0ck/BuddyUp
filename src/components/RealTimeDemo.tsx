'use client'

import React, { useState } from 'react'

interface RealTimeDemoProps {
  currentUserId: string
}

export default function RealTimeDemo({ currentUserId }: RealTimeDemoProps) {
  const [useSSE, setUseSSE] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Real-time Updates</h3>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useSSE}
              onChange={(e) => setUseSSE(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Use Server-Sent Events (more efficient)
            </span>
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Current Method:</h4>
          <div className="bg-gray-50 p-3 rounded">
            {useSSE ? (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700">Server-Sent Events</span>
                </div>
                <p className="text-gray-600">Real-time connection established. Updates arrive instantly when your buddy approves/rejects habits.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-blue-700">Polling</span>
                </div>
                <p className="text-gray-600">Checking for updates every 10 seconds. Simple and reliable.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">How it works:</h4>
          <div className="bg-gray-50 p-3 rounded">
            <ul className="space-y-1 text-gray-600">
              <li>• Buddy approves/rejects your habit</li>
              <li>• Database updates automatically</li>
              <li>• Your page refreshes with new data</li>
              <li>• You see the change immediately!</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
          <strong>✨ Real-time Magic:</strong> When your buddy takes action on their device, 
          you'll see it update on your screen automatically. No more manual refreshing!
        </p>
      </div>
    </div>
  )
} 