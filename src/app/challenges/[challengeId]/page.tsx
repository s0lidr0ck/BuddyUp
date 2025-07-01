import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'

interface PageProps {
  params: {
    challengeId: string
  }
}

async function getChallengeData(challengeId: string, userId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      habit: {
        include: {
          partnership: {
            include: {
              initiator: { select: { id: true, name: true, email: true } },
              receiver: { select: { id: true, name: true, email: true } }
            }
          }
        }
      },
      completions: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }
    }
  })

  if (!challenge) return null

  // Check if user is part of this challenge
  const isParticipant = 
    challenge.creatorId === userId ||
    challenge.habit.partnership.initiatorId === userId ||
    challenge.habit.partnership.receiverId === userId

  if (!isParticipant) return null

  return challenge
}

export default async function ChallengePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const challenge = await getChallengeData(params.challengeId, session.user.id)
  
  if (!challenge) {
    notFound()
  }

  const isCreator = challenge.creatorId === session.user.id
  const buddy = challenge.habit.partnership.initiatorId === session.user.id 
    ? challenge.habit.partnership.receiver 
    : challenge.habit.partnership.initiator

  const userCompletion = challenge.completions.find(c => c.userId === session.user.id)
  const buddyCompletion = challenge.completions.find(c => c.userId === buddy.id)

  const isOverdue = new Date() > new Date(challenge.dueDate)
  const daysLeft = Math.ceil((new Date(challenge.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))

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
              <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Challenge Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Today's Goal
              </h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isOverdue ? 'bg-red-100 text-red-700' :
                daysLeft === 0 ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {isOverdue ? 'Overdue' : 
                 daysLeft === 0 ? 'Due Today' : 
                 `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              "{challenge.title}"
            </h3>
            
            {challenge.description && (
              <p className="text-gray-700 mb-4">{challenge.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📝 {challenge.habit.name}</span>
              <span>👤 Created by {isCreator ? 'You' : challenge.creator.name || challenge.creator.email}</span>
              <span>🤝 with {buddy.name || buddy.email}</span>
            </div>
          </div>

          {/* Progress Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Your Progress */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Your Progress</h4>
              {userCompletion ? (
                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <span className="text-lg mr-2">✅</span>
                    <span className="font-medium">Completed!</span>
                  </div>
                  {userCompletion.proofText && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Your note:</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {userCompletion.proofText}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Completed {new Date(userCompletion.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">⏳</div>
                  <div className="text-gray-600">Not completed yet</div>
                  {!isOverdue && (
                    <form action="/api/challenges/complete" method="POST" className="mt-4">
                      <input type="hidden" name="challengeId" value={challenge.id} />
                      
                      <div className="mb-4">
                        <label htmlFor="proofText" className="block text-sm font-medium text-gray-700 mb-2">
                          Add a note (optional)
                        </label>
                        <textarea
                          id="proofText"
                          name="proofText"
                          rows={3}
                          placeholder="How did it go? Any thoughts or details..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        ✅ Mark Complete
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Buddy's Progress */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                {buddy.name || buddy.email}'s Progress
              </h4>
              {buddyCompletion ? (
                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <span className="text-lg mr-2">✅</span>
                    <span className="font-medium">Completed!</span>
                  </div>
                  {buddyCompletion.proofText && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Their note:</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {buddyCompletion.proofText}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Completed {new Date(buddyCompletion.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">⏳</div>
                  <div className="text-gray-600">Waiting for completion</div>
                </div>
              )}
            </div>
          </div>

          {/* Both Completed - Celebration */}
          {userCompletion && buddyCompletion && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Great job, both of you completed today's goal!
              </h3>
              <p className="text-green-700">
                Keep up the momentum and stay consistent with your habit building journey.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <a
              href="/dashboard"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Back to Dashboard
            </a>
            {isCreator && !isOverdue && (
              <a
                href={`/habits/${challenge.habit.id}/challenges/new`}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center"
              >
                Set Tomorrow's Goal
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 