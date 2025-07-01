import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'

interface PageProps {
  params: {
    habitId: string
  }
}

async function getHabitData(habitId: string, userId: string) {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: {
      partnership: {
        include: {
          initiator: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } }
        }
      },
      createdBy: { select: { id: true, name: true, email: true } },
      challenges: {
        where: {
          dueDate: {
            gte: new Date(new Date().toDateString()), // Today or later
          }
        },
        orderBy: { dueDate: 'desc' },
        take: 1
      }
    }
  })

  if (!habit) return null

  // Check if user is part of this habit
  const isParticipant = 
    habit.createdById === userId ||
    habit.partnership.initiatorId === userId ||
    habit.partnership.receiverId === userId

  if (!isParticipant) return null

  return habit
}

export default async function NewChallengePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const habit = await getHabitData(params.habitId, session.user.id)
  
  if (!habit) {
    notFound()
  }

  if (habit.status !== 'ACTIVE') {
    redirect('/dashboard')
  }

  // Check if there's already a challenge for today
  const today = new Date().toDateString()
  const existingTodayChallenge = habit.challenges.find(
    c => new Date(c.dueDate).toDateString() === today
  )

  const buddy = habit.partnership.initiatorId === session.user.id 
    ? habit.partnership.receiver 
    : habit.partnership.initiator

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
        {/* Challenge Creation Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Set Today's Goal
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📝 {habit.name}</span>
              <span>🤝 with {buddy.name || buddy.email}</span>
              <span>🔥 {habit.streakCount} day streak</span>
            </div>
          </div>

          {existingTodayChallenge ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="text-2xl mb-3">✅</div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                You already set today's goal!
              </h3>
              <p className="text-blue-700 mb-4">
                "<strong>{existingTodayChallenge.title}</strong>"
              </p>
              <a
                href={`/challenges/${existingTodayChallenge.id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Today's Challenge
              </a>
            </div>
          ) : (
            <form action="/api/challenges" method="POST">
              <input type="hidden" name="habitId" value={habit.id} />
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    What's your specific goal for today?
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    placeholder="e.g., Do 20 push-ups, Read for 30 minutes, Meditate for 10 minutes"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Any specific notes, location, or requirements for this goal..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">💡 Goal-setting tips:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Be specific: "20 push-ups" vs "exercise"</li>
                    <li>• Make it measurable: Include time, reps, or distance</li>
                    <li>• Keep it achievable for today</li>
                    <li>• Your buddy will see this and can help motivate you!</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    🎯 Set Today's Goal
                  </button>
                  <a
                    href="/dashboard"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Recent Challenges */}
        {habit.challenges.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Goals</h3>
            <div className="space-y-3">
              {habit.challenges.slice(0, 3).map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{challenge.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(challenge.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <a
                    href={`/challenges/${challenge.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 