import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

async function getDashboardData(userId: string) {
  const [user, partnerships, totalChallenges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        createdAt: true,
      }
    }),
    prisma.partnership.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
        habits: {
          include: {
            challenges: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              include: {
                creator: {
                  select: { name: true },
                },
                completions: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    }),
    prisma.challengeCompletion.count({
      where: { userId },
    }),
  ])

  return { user, partnerships, totalChallenges }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { user, partnerships, totalChallenges } = await getDashboardData(session.user.id)

  const activePartnerships = partnerships.filter((p: any) => p.status === 'ACTIVE')
  const pendingPartnerships = partnerships.filter((p: any) => p.status === 'PENDING')
  
  // Calculate max streak from all active habits
  const allActiveHabits = activePartnerships.flatMap((p: any) => p.habits.filter((h: any) => h.status === 'ACTIVE'))
  const maxStreak = allActiveHabits.length > 0 ? Math.max(...allActiveHabits.map((h: any) => h.streakCount)) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                <div className="w-4 h-4 bg-white rounded"></div>
              </div>
              <h1 className="text-xl font-bold text-gray-900">BuddyUp</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome back, {user?.name || 'there'}!</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Habit Dashboard</h2>
          <p className="text-gray-600">
            {activePartnerships.length === 0 
              ? "Ready to find a buddy to help you stick to your goals?"
              : `Keep it up! You have ${activePartnerships.length} active buddy${activePartnerships.length !== 1 ? ' connection' : ' connections'}.`
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-primary-600">{activePartnerships.length}</div>
            <div className="text-sm text-gray-600">Active Buddies</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{maxStreak}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalChallenges}</div>
            <div className="text-sm text-gray-600">Goals Completed</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingPartnerships.length}</div>
            <div className="text-sm text-gray-600">Pending Invites</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Buddy Connections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* No Buddies State */}
            {activePartnerships.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-primary-600 rounded"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Buddy</h3>
                <p className="text-gray-600 mb-6">
                  Get a friend, family member, or colleague to help you stick to your habits and stay motivated.
                </p>
                <a
                  href="/partnerships/invite"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <span className="mr-2">👋</span>
                  Invite Your First Buddy
                </a>
              </div>
            )}

            {/* Active Buddy Connections */}
            {activePartnerships.map((partnership: any) => {
              const buddy = partnership.initiatorId === session.user.id 
                ? partnership.receiver 
                : partnership.initiator
              
              // Get the most active habit or first habit
              const activeHabits = partnership.habits.filter((h: any) => h.status === 'ACTIVE')
              const primaryHabit = activeHabits[0] // Show first active habit
              
              if (!primaryHabit) {
                // Partnership exists but no active habits
                return (
                  <div key={partnership.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{buddy.name || buddy.email}</h3>
                          <p className="text-sm text-gray-600">Ready to start building habits together</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-blue-800 text-sm mb-2">🎯 Ready to create your first habit together?</p>
                      <a 
                        href={`/partnerships/${partnership.id}/habits/new`}
                        className="inline-flex items-center text-blue-700 hover:text-blue-800 text-sm font-medium"
                      >
                        Create a habit →
                      </a>
                    </div>
                  </div>
                )
              }
              
              const isMyTurn = primaryHabit.currentTurn === session.user.id
              
              return (
                <div key={partnership.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{buddy.name || buddy.email}</h3>
                        <p className="text-sm text-gray-600">{primaryHabit.name || 'Building habits together'}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{primaryHabit.streakCount}</div>
                      <div className="text-xs text-gray-600">day streak</div>
                    </div>
                  </div>
                  
                  {isMyTurn ? (
                    <div className="bg-primary-50 rounded-lg p-4">
                      <p className="text-primary-800 text-sm mb-2">🎯 Your turn to set a goal!</p>
                      <a 
                        href={`/habits/${primaryHabit.id}/challenge`}
                        className="inline-flex items-center text-primary-700 hover:text-primary-800 text-sm font-medium"
                      >
                        Create today's goal →
                      </a>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 text-sm">⏳ Waiting for {buddy.name || 'your buddy'} to set today's goal</p>
                    </div>
                  )}
                  
                  {/* Show additional habits if any */}
                  {activeHabits.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        +{activeHabits.length - 1} more habit{activeHabits.length > 2 ? 's' : ''} together
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add More Buddies */}
            {activePartnerships.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 border-dashed p-6 text-center">
                <h3 className="font-medium text-gray-900 mb-2">Want another buddy?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  You can have multiple buddies for different habits and goals.
                </p>
                <a
                  href="/partnerships/invite"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <span className="mr-2">👋</span>
                  Invite Another Buddy
                </a>
              </div>
            )}
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-6">
            
            {/* Pending Buddy Invites */}
            {pendingPartnerships.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Pending Invitations</h3>
                <div className="space-y-3">
                  {pendingPartnerships.map((partnership: any) => {
                    const buddy = partnership.initiatorId === session.user.id 
                      ? partnership.receiver 
                      : partnership.initiator
                    const isInviteReceived = partnership.receiverId === session.user.id
                    
                    return (
                      <div key={partnership.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{buddy.name || buddy.email}</p>
                          <p className="text-xs text-gray-600">
                            {isInviteReceived ? 'Wants to be your buddy' : 'Invitation sent'}
                          </p>
                        </div>
                        {isInviteReceived && (
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                              Accept
                            </button>
                            <button className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400">
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a href="/partnerships/invite" className="flex items-center text-gray-700 hover:text-primary-600 text-sm">
                  <span className="mr-3">👋</span>
                  Invite Buddy
                </a>
                <a href="/inspiration" className="flex items-center text-gray-700 hover:text-primary-600 text-sm">
                  <span className="mr-3">✨</span>
                  Inspiration Wall
                </a>
                <a href="/badges" className="flex items-center text-gray-700 hover:text-primary-600 text-sm">
                  <span className="mr-3">🏆</span>
                  View Badges
                </a>
                <a href="/settings" className="flex items-center text-gray-700 hover:text-primary-600 text-sm">
                  <span className="mr-3">⚙️</span>
                  Settings
                </a>
              </div>
            </div>

            {/* Motivational Quote */}
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-2">💪 Daily Motivation</h3>
              <p className="text-sm opacity-90">
                "Success is the sum of small efforts repeated day in and day out."
              </p>
              <p className="text-xs opacity-75 mt-2">- Robert Collier</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 