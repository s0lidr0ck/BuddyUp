'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { formatUserName } from '@/lib/utils'
import AddBuddyModal from './AddBuddyModal'
import PartnershipActions from './PartnershipActions'

interface BuddyData {
  activePartnerships: any[]
  pendingReceived: any[]
  pendingSent: any[]
  pausedPartnerships: any[]
  completedPartnerships: any[]
  user: any
}

interface BuddyManagementClientProps {
  initialData: BuddyData
  currentUserId: string
}

export default function BuddyManagementClient({ initialData, currentUserId }: BuddyManagementClientProps) {
  const [data, setData] = useState(initialData)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const router = useRouter()
  const { addToast } = useToast()

  const refreshData = async () => {
    router.refresh()
  }

  const getBuddyForPartnership = (partnership: any) => {
    return partnership.initiatorId === currentUserId ? partnership.receiver : partnership.initiator
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PAUSED': return 'bg-gray-100 text-gray-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'active', label: 'Active', count: data.activePartnerships.length },
    { id: 'pending', label: 'Pending', count: data.pendingReceived.length + data.pendingSent.length },
    { id: 'paused', label: 'Paused', count: data.pausedPartnerships.length },
    { id: 'completed', label: 'Completed', count: data.completedPartnerships.length },
  ]

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{data.activePartnerships.length}</div>
          <div className="text-sm text-gray-600">Active Buddies</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{data.pendingReceived.length}</div>
          <div className="text-sm text-gray-600">Pending Invites</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {data.activePartnerships.reduce((total, p) => total + p.habits.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Active Habits</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">
            {data.activePartnerships.reduce((total, p) => total + p._count.messages, 0)}
          </div>
          <div className="text-sm text-gray-600">Messages Sent</div>
        </div>
      </div>

      {/* Add New Buddy Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add New Buddy</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            ➕ Add Buddy
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Share Your Invite Link</h3>
            <p className="text-sm text-gray-600 mb-3">
              Send this link to friends to invite them as your accountability buddy
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${data.user.inviteCode}`}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/invite/${data.user.inviteCode}`)
                  addToast('Invite link copied!', 'success')
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Send Email Invite</h3>
            <p className="text-sm text-gray-600 mb-3">
              Invite someone directly by their email address
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full px-4 py-2 border border-primary-600 text-primary-600 rounded hover:bg-primary-50 transition-colors"
            >
              Send Invitation
            </button>
          </div>
        </div>
      </div>

      {/* Partnership Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'active' && (
            <div className="space-y-4">
              {data.activePartnerships.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active buddies yet</h3>
                  <p className="text-gray-600 mb-4">Start by inviting a friend to be your accountability buddy!</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add Your First Buddy
                  </button>
                </div>
              ) : (
                data.activePartnerships.map((partnership) => {
                  const buddy = getBuddyForPartnership(partnership)
                  return (
                    <div key={partnership.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {buddy.profilePicture ? (
                            <img
                              src={buddy.profilePicture}
                              alt={formatUserName(buddy)}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {buddy.firstName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{formatUserName(buddy)}</h3>
                            <p className="text-sm text-gray-600">{buddy.email}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                {partnership.habits.length} active habit{partnership.habits.length !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-gray-500">
                                {partnership._count.messages} messages
                              </span>
                              <span className="text-xs text-gray-500">
                                Since {new Date(partnership.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partnership.status)}`}>
                            {partnership.status}
                          </span>
                          <PartnershipActions 
                            partnership={partnership} 
                            onUpdate={refreshData}
                          />
                        </div>
                      </div>
                      
                      {partnership.habits.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Habits</h4>
                          <div className="flex flex-wrap gap-2">
                            {partnership.habits.map((habit: any) => (
                              <span
                                key={habit.id}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {habit.name} (🔥 {habit.streakCount})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-6">
              {/* Pending Received */}
              {data.pendingReceived.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Invitations Received</h3>
                  <div className="space-y-3">
                    {data.pendingReceived.map((partnership) => {
                      const buddy = getBuddyForPartnership(partnership)
                      return (
                        <div key={partnership.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {buddy.profilePicture ? (
                                <img
                                  src={buddy.profilePicture}
                                  alt={formatUserName(buddy)}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 font-medium text-sm">
                                    {buddy.firstName?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-gray-900">{formatUserName(buddy)}</h4>
                                <p className="text-sm text-gray-600">wants to be your accountability buddy</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/partnerships/accept', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ inviterId: buddy.id })
                                    })
                                    if (response.ok) {
                                      addToast('Buddy request accepted!', 'success')
                                      refreshData()
                                    }
                                  } catch (error) {
                                    addToast('Failed to accept request', 'error')
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => addToast('Decline functionality coming soon', 'info')}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pending Sent */}
              {data.pendingSent.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Invitations Sent</h3>
                  <div className="space-y-3">
                    {data.pendingSent.map((partnership) => (
                      <div key={partnership.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {partnership.receiver.profilePicture ? (
                              <img
                                src={partnership.receiver.profilePicture}
                                alt={formatUserName(partnership.receiver)}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-medium text-sm">
                                  {partnership.receiver.firstName?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">{formatUserName(partnership.receiver)}</h4>
                              <p className="text-sm text-gray-600">Waiting for response...</p>
                            </div>
                          </div>
                          
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.pendingReceived.length === 0 && data.pendingSent.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📨</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
                  <p className="text-gray-600">All caught up!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'paused' && (
            <div className="space-y-4">
              {data.pausedPartnerships.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">⏸️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No paused partnerships</h3>
                  <p className="text-gray-600">All your partnerships are either active or completed!</p>
                </div>
              ) : (
                data.pausedPartnerships.map((partnership) => {
                  const buddy = getBuddyForPartnership(partnership)
                  return (
                    <div key={partnership.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {buddy.profilePicture ? (
                            <img
                              src={buddy.profilePicture}
                              alt={formatUserName(buddy)}
                              className="w-12 h-12 rounded-full object-cover opacity-75"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center opacity-75">
                              <span className="text-gray-600 font-medium">
                                {buddy.firstName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{formatUserName(buddy)}</h3>
                            <p className="text-sm text-gray-600">Partnership paused</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partnership.status)}`}>
                            PAUSED
                          </span>
                          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                            Resume
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-4">
              {data.completedPartnerships.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed partnerships</h3>
                  <p className="text-gray-600">Your completed partnerships will appear here</p>
                </div>
              ) : (
                data.completedPartnerships.map((partnership) => {
                  const buddy = getBuddyForPartnership(partnership)
                  return (
                    <div key={partnership.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {buddy.profilePicture ? (
                            <img
                              src={buddy.profilePicture}
                              alt={formatUserName(buddy)}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {buddy.firstName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{formatUserName(buddy)}</h3>
                            <p className="text-sm text-gray-600">Partnership completed</p>
                          </div>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partnership.status)}`}>
                          COMPLETED
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Buddy Modal */}
      {showAddModal && (
        <AddBuddyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshData}
        />
      )}
    </div>
  )
} 