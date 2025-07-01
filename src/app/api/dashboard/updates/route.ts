import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const since = searchParams.get('since')
  
  if (!since) {
    return Response.json({ error: 'Missing since parameter' }, { status: 400 })
  }

  const sinceDate = new Date(parseInt(since))
  const userId = session.user.id

  try {
    // Check for any updates to user's data since the timestamp
    const [
      updatedHabits,
      updatedPartnerships,
      newChallengeCompletions
    ] = await Promise.all([
      // Check for habit status changes (approvals/rejections)
      prisma.habit.findMany({
        where: {
          updatedAt: { gte: sinceDate },
          OR: [
            { createdById: userId },
            {
              partnership: {
                OR: [
                  { initiatorId: userId },
                  { receiverId: userId }
                ]
              }
            }
          ]
        },
        select: { id: true, updatedAt: true }
      }),

      // Check for partnership status changes
      prisma.partnership.findMany({
        where: {
          updatedAt: { gte: sinceDate },
          OR: [
            { initiatorId: userId },
            { receiverId: userId }
          ]
        },
        select: { id: true, updatedAt: true }
      }),

      // Check for new challenge completions
      prisma.challengeCompletion.findMany({
        where: {
          createdAt: { gte: sinceDate },
          challenge: {
            habit: {
              partnership: {
                OR: [
                  { initiatorId: userId },
                  { receiverId: userId }
                ]
              }
            }
          }
        },
        select: { id: true, createdAt: true }
      })
    ])

    const hasUpdates = 
      updatedHabits.length > 0 || 
      updatedPartnerships.length > 0 || 
      newChallengeCompletions.length > 0

    return Response.json({ 
      hasUpdates,
      timestamp: Date.now(),
      updates: {
        habits: updatedHabits.length,
        partnerships: updatedPartnerships.length,
        completions: newChallengeCompletions.length
      }
    })

  } catch (error) {
    console.error('Error checking for updates:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 