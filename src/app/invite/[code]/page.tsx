import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AcceptInviteForm } from './AcceptInviteForm'

interface PageProps {
  params: {
    code: string
  }
}

async function getInviteData(code: string) {
  const inviter = await prisma.user.findFirst({
    where: { inviteCode: code },
    select: { 
      id: true, 
      name: true, 
      email: true,
      inviteCode: true 
    }
  })

  return inviter
}

export default async function InvitePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const inviter = await getInviteData(params.code)

  // If invite code is invalid
  if (!inviter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">
            This invite link is not valid or may have expired.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to BuddyUp
          </a>
        </div>
      </div>
    )
  }

  // If user is trying to invite themselves
  if (session?.user?.id === inviter.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-600 text-2xl">🤔</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">That's Your Own Invite!</h1>
          <p className="text-gray-600 mb-6">
            You can't use your own invite link. Share it with friends to connect as buddies!
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // If user is not logged in, redirect to sign up with invite context
  if (!session?.user?.id) {
    redirect(`/auth/signup?invite=${params.code}&from=${encodeURIComponent(inviter.name || inviter.email)}`)
  }

  // User is logged in - show invite acceptance
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-600 text-2xl">👋</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">You're Invited!</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              <span className="font-semibold text-gray-900">{inviter.name || inviter.email}</span> wants to be your buddy on BuddyUp.
            </p>
            <p className="text-gray-600">
              Connect with them to build great habits together and keep each other motivated!
            </p>
          </div>

          <AcceptInviteForm inviterId={inviter.id} inviterName={inviter.name || inviter.email} />
        </div>
      </div>
    </div>
  )
} 