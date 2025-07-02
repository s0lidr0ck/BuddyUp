import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { formatUserName } from '@/lib/utils'
import ChatTimeline from './ChatTimeline'

interface PageProps {
  params: { partnershipId: string }
}

async function getPartnershipData(partnershipId: string, userId: string) {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/partnerships/${partnershipId}/timeline`, {
    headers: {
      'Cookie': `__Secure-next-auth.session-token=${process.env.SESSION_TOKEN}` // We'll handle this differently
    }
  })
  
  if (!response.ok) return null
  return response.json()
}

export default async function ChatPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // For now, let's create a simpler server-side data fetch
  // We'll move the timeline logic here temporarily
  const partnership = await prisma.partnership.findFirst({
    where: {
      id: params.partnershipId,
      OR: [
        { initiatorId: session.user.id },
        { receiverId: session.user.id }
      ]
    },
          include: {
        initiator: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } }
    }
  })

  if (!partnership) {
    notFound()
  }

  const buddy = partnership.initiatorId === session.user.id 
    ? partnership.receiver 
    : partnership.initiator

  // Map buddy data to match ChatTimeline interface
  const buddyForChat = {
    id: buddy.id,
    firstName: buddy.firstName,
    lastName: buddy.lastName,
    email: buddy.email,
    image: buddy.profilePicture
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900 mr-3 sm:mr-4 flex-shrink-0">
                ← Back
              </a>
              {buddyForChat.image ? (
                <img
                  src={buddyForChat.image}
                  alt={formatUserName(buddyForChat)}
                  className="w-8 h-8 rounded-full object-cover mr-2 sm:mr-3 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full mr-2 sm:mr-3 flex-shrink-0 flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {buddyForChat.firstName?.charAt(0)?.toUpperCase() || buddyForChat.email?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {formatUserName(buddyForChat)}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Buddy Chat</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <span className="text-xs sm:text-sm text-gray-600">🔥 Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Timeline Content */}
      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
        <ChatTimeline 
          partnershipId={params.partnershipId}
          currentUserId={session.user.id}
          buddy={buddyForChat}
        />
      </main>
    </div>
  )
} 