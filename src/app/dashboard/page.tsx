import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatUserName } from '@/lib/utils'
import ActivityFeed from '@/components/ActivityFeed'
import ConnectionStatus from '@/components/ConnectionStatus'
import NotificationBell from '@/components/NotificationBell'

async function getDashboardData(userId: string) {
  const [user, partnerships, totalChallenges, pendingHabitApprovals, myPendingHabits, recentlyDeclinedHabits, activeChallenges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        email: true,
        createdAt: true,
        profilePicture: true,
      }
    }),
    prisma.partnership.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        initiator: { 
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } 
        },
        receiver: { 
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } 
        },
        habits: {
          include: {
            partnership: {
              include: {
                initiator: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } },
                receiver: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.challengeCompletion.count({
      where: { userId },
    }),
    // Get pending habit approvals (habits created by others that need my approval)
    prisma.habit.findMany({
      where: {
        status: 'PENDING',
        partnership: {
          OR: [
            { initiatorId: userId },
            { receiverId: userId }
          ]
        },
        NOT: {
          createdById: userId, // Exclude habits I created
        },
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true },
        },
        partnership: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Get habits I created that are pending approval
    prisma.habit.findMany({
      where: {
        status: 'PENDING',
        createdById: userId,
      },
      include: {
        partnership: {
          include: {
            initiator: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } },
            receiver: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Get recently declined habits (for notification purposes)
    prisma.habit.findMany({
      where: {
        status: 'CANCELLED',
        createdById: userId,
        dismissedAt: null, // Only show non-dismissed declined habits
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        partnership: {
          include: {
            initiator: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } },
            receiver: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } }
          }
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    // Get active challenges that need completion
    prisma.challenge.findMany({
      where: {
        status: 'ACTIVE',
        habit: {
          partnership: {
            OR: [
              { initiatorId: userId },
              { receiverId: userId }
            ]
          }
        }
      },
      include: {
        habit: {
          include: {
            partnership: {
              include: {
                initiator: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } },
                receiver: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } }
              }
            }
          }
        },
        creator: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } },
        completions: true // Get all completions to check both users
      },
      orderBy: { dueDate: 'asc' }
    }),
  ])

  return { user, partnerships, totalChallenges, pendingHabitApprovals, myPendingHabits, recentlyDeclinedHabits, activeChallenges }
}

function createActivityFeed(data: any, userId: string) {
  const activities: any[] = []
  
  // 1. Habit approvals needed (highest priority)
  data.pendingHabitApprovals.forEach((habit: any) => {
    activities.push({
      id: `approval-${habit.id}`,
      type: 'habit_approval',
      timestamp: new Date(habit.createdAt),
      priority: 1,
      data: habit
    })
  })

  // 2. Group all active habits by buddy (simplified approach)
  const habitsByBuddy = new Map()
  
  const activePartnerships = data.partnerships.filter((p: any) => p.status === 'ACTIVE')
  activePartnerships.forEach((partnership: any) => {
    const activeHabits = partnership.habits.filter((h: any) => h.status === 'ACTIVE')
    
    if (activeHabits.length > 0) {
      const buddy = partnership.initiatorId === userId ? partnership.receiver : partnership.initiator
      const buddyKey = buddy.id
      
      if (!habitsByBuddy.has(buddyKey)) {
        habitsByBuddy.set(buddyKey, {
          buddy,
          habits: []
        })
      }
      
      // Add all active habits for this buddy
      activeHabits.forEach((habit: any) => {
        // Find today's and tomorrow's challenges for this habit
        const today = new Date().toDateString()
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
        
        const todaysChallenge = data.activeChallenges.find((challenge: any) => 
          challenge.habit.id === habit.id && 
          new Date(challenge.dueDate).toDateString() === today
        )
        
        const tomorrowsChallenge = data.activeChallenges.find((challenge: any) => 
          challenge.habit.id === habit.id && 
          new Date(challenge.dueDate).toDateString() === tomorrow
        )
        
        // Check completion status
        const userCompleted = todaysChallenge ? 
          todaysChallenge.completions.some((c: any) => c.userId === userId) : false
        const buddyCompleted = todaysChallenge ? 
          todaysChallenge.completions.some((c: any) => c.userId === buddy.id) : false
        
        // Determine what action is needed
        let actionNeeded = 'WAITING'
        let isSettingTomorrow = false
        
        if (habit.currentTurn === userId) {
          if (!todaysChallenge) {
            // No challenge today - can set today's goal
            actionNeeded = 'SET_GOAL'
            isSettingTomorrow = false
          } else if (userCompleted && buddyCompleted && !tomorrowsChallenge) {
            // Both completed today, no tomorrow challenge yet - can set tomorrow's goal
            actionNeeded = 'SET_GOAL'
            isSettingTomorrow = true
          }
        } else if (todaysChallenge && !userCompleted) {
          // There's a challenge today and user hasn't completed it
          actionNeeded = 'COMPLETE_GOAL'
        }
        
        habitsByBuddy.get(buddyKey).habits.push({
          ...habit,
          partnership,
          buddy,
          todaysChallenge,
          tomorrowsChallenge,
          userCompleted,
          buddyCompleted,
          actionNeeded,
          isSettingTomorrow,
          // Add preview info for tomorrow's challenge
          tomorrowPreview: tomorrowsChallenge ? {
            title: tomorrowsChallenge.title,
            description: tomorrowsChallenge.description,
            creator: tomorrowsChallenge.creator
          } : null
        })
      })
    }
  })

  // Create activity for each buddy with all their habits
  habitsByBuddy.forEach((group, buddyId) => {
    activities.push({
      id: `buddy-habits-${buddyId}`,
      type: 'buddy_habits',
      timestamp: new Date(Math.max(...group.habits.map((h: any) => new Date(h.updatedAt).getTime()))),
      priority: 2,
      data: {
        buddy: group.buddy,
        habits: group.habits,
        totalHabits: group.habits.length
      }
    })
  })

  // 3. Pending buddy invites (medium priority)
  const pendingPartnerships = data.partnerships.filter((p: any) => p.status === 'PENDING')
  pendingPartnerships.forEach((partnership: any) => {
    const isInviteReceived = partnership.receiverId === userId
    if (isInviteReceived) {
      const buddy = partnership.initiator
      activities.push({
        id: `invite-${partnership.id}`,
        type: 'buddy_invite',
        timestamp: new Date(partnership.createdAt),
        priority: 3,
        data: {
          partnership,
          buddy
        }
      })
    }
  })

  // 4. Recent pass notifications (medium priority)
  activePartnerships.forEach((partnership: any) => {
    const activeHabits = partnership.habits.filter((h: any) => h.status === 'ACTIVE')
    activeHabits.forEach((habit: any) => {
      // Show pass notification if someone passed in the last 2 hours and it's now your turn
      if (habit.lastPassedBy && habit.passedAt && habit.currentTurn === userId) {
        const passedAt = new Date(habit.passedAt)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
        
        if (passedAt > twoHoursAgo) {
          const passer = partnership.initiatorId === habit.lastPassedBy 
            ? partnership.initiator 
            : partnership.receiver
          
          activities.push({
            id: `pass-${habit.id}`,
            type: 'turn_passed',
            timestamp: passedAt,
            priority: 3,
            data: {
              ...habit,
              passer,
              buddy: partnership.initiatorId === userId ? partnership.receiver : partnership.initiator
            }
          })
        }
      }
    })
  })

  // 5. My pending habits (lower priority)
  data.myPendingHabits.forEach((habit: any) => {
    const buddy = habit.partnership.initiatorId === userId 
      ? habit.partnership.receiver 
      : habit.partnership.initiator
    
    activities.push({
      id: `pending-${habit.id}`,
      type: 'habit_pending',
      timestamp: new Date(habit.createdAt),
      priority: 4,
      data: {
        ...habit,
        buddy
      }
    })
  })

  // 6. Recently declined habits (lowest priority)
  data.recentlyDeclinedHabits.forEach((habit: any) => {
    const buddy = habit.partnership.initiatorId === userId 
      ? habit.partnership.receiver 
      : habit.partnership.initiator
    
    activities.push({
      id: `declined-${habit.id}`,
      type: 'habit_declined',
      timestamp: new Date(habit.updatedAt),
      priority: 5,
      data: {
        ...habit,
        buddy
      }
    })
  })

  return activities
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const data = await getDashboardData(session.user.id)
  const { user, partnerships } = data

  const activePartnerships = partnerships.filter((p: any) => p.status === 'ACTIVE')
  
  // Calculate stats from all active habits
  const allActiveHabits = activePartnerships.flatMap((p: any) => p.habits.filter((h: any) => h.status === 'ACTIVE'))
  const maxStreak = allActiveHabits.length > 0 ? Math.max(...allActiveHabits.map((h: any) => h.streakCount)) : 0
  const totalActiveHabits = allActiveHabits.length

  // Create activity feed
  const activities = createActivityFeed(data, session.user.id)

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
              <span className="text-sm text-gray-600">Welcome back, {user?.firstName || 'there'}!</span>
              <NotificationBell />
              <a 
                href="/buddies"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                title="Manage Buddies"
              >
                👥
              </a>
              <a 
                href="/account"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                title="Account Settings"
              >
                ⚙️
              </a>
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={`${user.firstName || 'User'}'s profile`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {user?.firstName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Your Activity Feed</h2>
            <ConnectionStatus enableSSE={true} />
          </div>
          <p className="text-gray-600">
            {activePartnerships.length === 0 
              ? "Ready to find a buddy to help you stick to your goals?"
              : `Stay on top of your habits and buddy activities!`
            }
          </p>
        </div>

        {/* Stats Cards - Compact Mobile Design */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-primary-600">{totalActiveHabits}</div>
              <div className="text-xs sm:text-sm text-gray-600">Active Habits</div>
              {activePartnerships.length > 0 && (
                <div className="text-xs text-gray-400 mt-1 hidden sm:block">with {activePartnerships.length} buddy{activePartnerships.length !== 1 ? 'ies' : ''}</div>
              )}
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{maxStreak}</div>
              <div className="text-xs sm:text-sm text-gray-600">Best Streak</div>
              <div className="text-xs text-gray-400 mt-1">points</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{data.totalChallenges}</div>
              <div className="text-xs sm:text-sm text-gray-600">Goals Done</div>
            </div>
          </div>
        </div>

        {/* No Buddies State */}
        {activePartnerships.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center mb-8">
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

        {/* Activity Feed */}
        <div className="mb-8">
          <ActivityFeed 
            activities={activities} 
            currentUserId={session.user.id}
            enableSSE={true}
          />
        </div>

        {/* Quick Actions */}
        {activePartnerships.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex justify-center space-x-4">
              <a
                href="/habits/new"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span className="mr-2">🎯</span>
                Create New Habit
              </a>
              <a
                href="/partnerships/invite"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">👋</span>
                Got another buddy?
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 