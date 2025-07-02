import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const challengeId = formData.get('challengeId') as string
    const reflectionNote = formData.get('reflectionNote') as string
    const feelingTags = formData.get('feelingTags') as string

    if (!challengeId) {
      return Response.json({ error: 'Missing challenge ID' }, { status: 400 })
    }

    // Verify challenge exists and user has access
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        habit: {
          include: {
            partnership: true
          }
        },
        completions: true
      }
    })

    if (!challenge) {
      return Response.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Check if user is part of this challenge
    const isParticipant = 
      challenge.creatorId === session.user.id ||
      challenge.habit.partnership.initiatorId === session.user.id ||
      challenge.habit.partnership.receiverId === session.user.id

    if (!isParticipant) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if already completed
    const existingCompletion = challenge.completions.find((c: any) => c.userId === session.user.id)
    if (existingCompletion) {
      return Response.json({ error: 'Challenge already completed' }, { status: 400 })
    }

    // Check if challenge is due (can't complete future challenges)
    const today = new Date()
    const challengeDueDate = new Date(challenge.dueDate)
    
    // Set both to start of day for accurate comparison
    today.setHours(0, 0, 0, 0)
    challengeDueDate.setHours(0, 0, 0, 0)
    
    if (challengeDueDate > today) {
      return Response.json({ 
        error: 'Cannot complete future challenges. This goal is due on ' + challengeDueDate.toLocaleDateString(),
        isFutureChallenge: true 
      }, { status: 400 })
    }

    // Create completion
    const completion = await prisma.challengeCompletion.create({
      data: {
        challengeId: challengeId,
        userId: session.user.id,
        reflectionNote: reflectionNote?.trim() || null,
        feelingTags: feelingTags || null
      }
    })

    // Check if both participants have completed
    const allCompletions = await prisma.challengeCompletion.findMany({
      where: { challengeId: challengeId }
    })

    const partnerId = challenge.habit.partnership.initiatorId === session.user.id 
      ? challenge.habit.partnership.receiverId 
      : challenge.habit.partnership.initiatorId

    const bothCompleted = allCompletions.some((c: any) => c.userId === session.user.id) && 
                         allCompletions.some((c: any) => c.userId === partnerId)

    // Update habit streak if both completed (turn already switched when challenge was created)
    if (bothCompleted) {
      await prisma.habit.update({
        where: { id: challenge.habit.id },
        data: { 
          streakCount: { increment: 1 },
          updatedAt: new Date()
        }
      })
    }

    return Response.redirect(new URL(`/challenges/${challengeId}`, request.url), 303)

  } catch (error) {
    console.error('Error completing challenge:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 