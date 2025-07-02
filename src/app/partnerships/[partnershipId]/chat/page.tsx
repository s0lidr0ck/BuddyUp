import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
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
      initiator: { select: { id: true, name: true, email: true, image: true } },
      receiver: { select: { id: true, name: true, email: true, image: true } }
    }
  })

  if (!partnership) {
    notFound()
  }

  const buddy = partnership.initiatorId === session.user.id 
    ? partnership.receiver 
    : partnership.initiator

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Back
              </a>
              <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {buddy.name || buddy.email}
                </h1>
                <p className="text-sm text-gray-500">Buddy Chat</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">🔥 Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Timeline Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ChatTimeline 
          partnershipId={params.partnershipId}
          currentUserId={session.user.id}
          buddy={buddy}
        />
      </main>
    </div>
  )
} 