import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatUserName } from '@/lib/utils'
import BuddyManagementClient from './BuddyManagementClient'
import NotificationBell from '@/components/NotificationBell'

async function getBuddyData(userId: string) {
  const [partnerships, pendingInvites, user] = await Promise.all([
    // Get all partnerships (any status)
    prisma.partnership.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        initiator: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true },
        },
        habits: {
          where: { status: { in: ['ACTIVE', 'PENDING'] } },
          select: {
            id: true,
            name: true,
            status: true,
            streakCount: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            messages: true,
            habits: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Get pending partnership invitations sent by this user
    prisma.partnership.findMany({
      where: {
        initiatorId: userId,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true },
        },
      },
    }),

    // Get user's invite code
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        inviteCode: true,
        firstName: true,
        lastName: true,
      },
    }),
  ])

  // Separate partnerships by status and role
  const activePartnerships = partnerships.filter(p => p.status === 'ACTIVE')
  const pendingReceived = partnerships.filter(p => p.status === 'PENDING' && p.receiverId === userId)
  const pausedPartnerships = partnerships.filter(p => p.status === 'PAUSED')
  const completedPartnerships = partnerships.filter(p => p.status === 'COMPLETED')

  return {
    activePartnerships,
    pendingReceived,
    pendingSent: pendingInvites,
    pausedPartnerships,
    completedPartnerships,
    user,
  }
}

export default async function BuddiesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const data = await getBuddyData(session.user.id)

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
              <h1 className="text-xl font-bold text-gray-900">My Buddies</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {data.activePartnerships.length} active buddy{data.activePartnerships.length !== 1 ? 'ies' : 'y'}
              </span>
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BuddyManagementClient 
          initialData={data}
          currentUserId={session.user.id}
        />
      </main>
    </div>
  )
} 