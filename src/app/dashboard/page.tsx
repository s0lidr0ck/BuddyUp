import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ActivityFeed from '@/components/ActivityFeed'
import ConnectionStatus from '@/components/ConnectionStatus'

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

  // 2. Group active challenges by buddy (high priority) - show only most relevant challenge per habit
  const challengesByBuddy = new Map()
  const buddiesWithChallenges = new Set() // Track which buddies have challenge cards
  
  // First, group challenges by habit
  const challengesByHabit = new Map()
  data.activeChallenges.forEach((challenge: any) => {
    const habitId = challenge.habit.id
    if (!challengesByHabit.has(habitId)) {
      challengesByHabit.set(habitId, [])
    }
    challengesByHabit.get(habitId).push(challenge)
  })
  
  // For each habit, select the most relevant challenge
  challengesByHabit.forEach((challenges, habitId) => {
    const today = new Date().toDateString()
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
    
    // Sort challenges by due date
    challenges.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    
    let selectedChallenge = null
    
    // Priority 1: Find current uncompleted challenge
    const currentUncompleted = challenges.find((c: any) => {
      const challengeDate = new Date(c.dueDate).toDateString()
      const userCompleted = c.completions.some((comp: any) => comp.userId === userId)
      return challengeDate <= today && !userCompleted
    })
    
    if (currentUncompleted) {
      selectedChallenge = currentUncompleted
    } else {
      // Priority 2: If today is completed, show tomorrow's challenge
      const todaysChallenge = challenges.find((c: any) => new Date(c.dueDate).toDateString() === today)
      const userCompletedToday = todaysChallenge?.completions.some((comp: any) => comp.userId === userId)
      
      if (userCompletedToday) {
        const tomorrowsChallenge = challenges.find((c: any) => new Date(c.dueDate).toDateString() === tomorrow)
        if (tomorrowsChallenge) {
          selectedChallenge = tomorrowsChallenge
        }
      }
      
      // Priority 3: Show most recent completed challenge as fallback
      if (!selectedChallenge) {
        selectedChallenge = challenges[challenges.length - 1] // Most recent
      }
    }
    
    if (selectedChallenge) {
      const buddy = selectedChallenge.habit.partnership.initiatorId === userId 
        ? selectedChallenge.habit.partnership.receiver 
        : selectedChallenge.habit.partnership.initiator
      
      const userCompletedChallenge = selectedChallenge.completions.some((c: any) => c.userId === userId)
      const buddyKey = buddy.id
      
      // Track that this buddy has challenge cards
      buddiesWithChallenges.add(buddyKey)
      
      if (!challengesByBuddy.has(buddyKey)) {
        challengesByBuddy.set(buddyKey, {
          buddy,
          challenges: []
        })
      }
      challengesByBuddy.get(buddyKey).challenges.push({
        ...selectedChallenge,
        userCompleted: userCompletedChallenge
      })
    }
  })

  // Create a single activity for each buddy with their selected challenges
  challengesByBuddy.forEach((group, buddyId) => {
    const latestChallenge = group.challenges.reduce((latest: any, current: any) => 
      new Date(current.dueDate) > new Date(latest.dueDate) ? current : latest
    )
    
    activities.push({
      id: `challenges-${buddyId}`,
      type: 'challenges_completion',
      timestamp: new Date(latestChallenge.dueDate),
      priority: 2,
      data: {
        buddy: group.buddy,
        challenges: group.challenges,
        streakCount: group.challenges[0]?.habit?.streakCount || 0
      }
    })
  })

  // 3. Goals needed (medium priority)
  const activePartnerships = data.partnerships.filter((p: any) => p.status === 'ACTIVE')
  activePartnerships.forEach((partnership: any) => {
    const activeHabits = partnership.habits.filter((h: any) => h.status === 'ACTIVE')
    activeHabits.forEach((habit: any) => {
      const buddy = partnership.initiatorId === userId ? partnership.receiver : partnership.initiator
      
      // Skip if we already have challenge cards for this buddy
      if (buddiesWithChallenges.has(buddy.id)) {
        return
      }
      
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
      
      // Check if user has completed today's challenge
      const userCompletedToday = todaysChallenge && 
        todaysChallenge.completions.some((c: any) => c.userId === userId)
      
      // Check if there are any incomplete challenges for this habit that the user hasn't completed
      const habitHasIncompleteChallenge = data.activeChallenges.some((challenge: any) => 
        challenge.habit.id === habit.id && 
        !challenge.completions.some((c: any) => c.userId === userId)
      )
      
      // Show goal setting option if it's user's turn and appropriate conditions are met
      if (habit.currentTurn === userId) {
        // Case 1: No challenge today - can set today's goal
        if (!todaysChallenge) {
          activities.push({
            id: `goal-${habit.id}`,
            type: 'goal_needed',
            timestamp: new Date(habit.updatedAt),
            priority: 3,
            data: {
              ...habit,
              buddy,
              isSettingTomorrow: false
            }
          })
        }
        // Case 2: Completed today, no tomorrow challenge yet - can set tomorrow's goal
        else if (userCompletedToday && !tomorrowsChallenge) {
          activities.push({
            id: `goal-${habit.id}`,
            type: 'goal_needed',
            timestamp: new Date(habit.updatedAt),
            priority: 3,
            data: {
              ...habit,
              buddy,
              isSettingTomorrow: true
            }
          })
        }
        // Case 3: Has incomplete challenge - show as waiting
        else if (habitHasIncompleteChallenge) {
          // Don't show goal setting if user has incomplete challenges
        }
      }
      // Note: Removed goal_waiting activities since challenge cards now cover this
    })
  })

  // 4. Pending buddy invites (medium priority)
  const pendingPartnerships = data.partnerships.filter((p: any) => p.status === 'PENDING')
  pendingPartnerships.forEach((partnership: any) => {
    const isInviteReceived = partnership.receiverId === userId
    if (isInviteReceived) {
      const buddy = partnership.initiator
      activities.push({
        id: `invite-${partnership.id}`,
        type: 'buddy_invite',
        timestamp: new Date(partnership.createdAt),
        priority: 4,
        data: {
          partnership,
          buddy
        }
      })
    }
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
      priority: 5,
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
      priority: 6,
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-primary-600">{totalActiveHabits}</div>
            <div className="text-sm text-gray-600">Active Habits</div>
            {activePartnerships.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">with {activePartnerships.length} buddy{activePartnerships.length !== 1 ? 'ies' : ''}</div>
            )}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{maxStreak}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{data.totalChallenges}</div>
            <div className="text-sm text-gray-600">Goals Completed</div>
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

        {/* Debug: All Active Habits */}
        {allActiveHabits.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-yellow-900 mb-4">Debug: All Your Active Habits ({allActiveHabits.length})</h3>
            <div className="space-y-3">
              {allActiveHabits.map((habit: any) => {
                const partnership = activePartnerships.find((p: any) => p.id === habit.partnershipId)
                const buddy = partnership?.initiatorId === session.user.id ? partnership?.receiver : partnership?.initiator
                return (
                  <div key={habit.id} className="bg-white rounded p-3 border border-yellow-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-gray-900">{habit.name}</strong>
                        <p className="text-sm text-gray-600">with {buddy?.name || buddy?.email}</p>
                        <p className="text-xs text-gray-500">
                          Turn: {habit.currentTurn === session.user.id ? 'Your turn' : 'Buddy\'s turn'} | 
                          Streak: {habit.streakCount} | 
                          Status: {habit.status}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`/partnerships/${habit.partnershipId}/chat`}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          💬 Chat
                        </a>
                        {habit.currentTurn === session.user.id && (
                          <a
                            href={`/habits/${habit.id}/challenges/new`}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                          >
                            🎯 Set Goal
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
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