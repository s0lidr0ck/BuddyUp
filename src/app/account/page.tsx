import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatUserName } from '@/lib/utils'
import AccountForm from './AccountForm'
import CopyInviteLink from './CopyInviteLink'
import NotificationBell from '@/components/NotificationBell'

async function getUserData(userId: string) {
  const [user, partnerships, habitsCreated, challengeCompletions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePicture: true,
        username: true,
        timezone: true,
        reminderTime: true,
        inviteCode: true,
        createdAt: true,
      }
    }),
    // Active partnerships count
    prisma.partnership.count({
      where: {
        OR: [
          { initiatorId: userId },
          { receiverId: userId }
        ],
        status: 'ACTIVE'
      }
    }),
    // Habits created count
    prisma.habit.count({
      where: {
        createdById: userId,
        status: { in: ['ACTIVE', 'COMPLETED'] }
      }
    }),
    // Challenge completions count
    prisma.challengeCompletion.count({
      where: { userId }
    })
  ])

  // Calculate current streak (simplified - could be more sophisticated)
  const activeHabits = await prisma.habit.findMany({
    where: {
      OR: [
        { 
          partnership: { initiatorId: userId },
          status: 'ACTIVE'
        },
        { 
          partnership: { receiverId: userId },
          status: 'ACTIVE'
        }
      ]
    },
    select: { streakCount: true }
  })

  const currentStreak = activeHabits.length > 0 ? Math.max(...activeHabits.map(h => h.streakCount)) : 0

  return { 
    user, 
    stats: {
      activePartnerships: partnerships,
      habitsCreated,
      challengeCompletions,
      currentStreak
    }
  }
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { user, stats } = await getUserData(session.user.id)

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a 
                href="/dashboard"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 mr-6"
              >
                ← Back to Dashboard
              </a>
              <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={`${user.firstName || 'User'}'s profile`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {user.firstName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={`${formatUserName(user)}'s profile`}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-2xl font-medium">
                      {user.firstName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formatUserName(user)}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Account Form */}
          <AccountForm user={user} />

          {/* Invite Code Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Invite Link</h3>
            <p className="text-gray-600 mb-4">
              Share this link with friends to invite them as your accountability buddy:
            </p>
            <CopyInviteLink inviteCode={user.inviteCode!} />
          </div>

          {/* Account Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{stats.activePartnerships}</div>
                <div className="text-sm text-gray-600">Active Partnerships</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.habitsCreated}</div>
                <div className="text-sm text-gray-600">Habits Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.challengeCompletions}</div>
                <div className="text-sm text-gray-600">Goals Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.currentStreak}</div>
                <div className="text-sm text-gray-600">Current Streak</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 