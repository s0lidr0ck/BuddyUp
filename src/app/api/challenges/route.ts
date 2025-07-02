import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createChallengeSchema = z.object({
  partnershipId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().transform((str) => new Date(str)),
})

const completeChallengeSchema = z.object({
  challengeId: z.string(),
  status: z.enum(['COMPLETED', 'MISSED', 'SKIPPED']).default('COMPLETED'),
  feelingTags: z.array(z.string()).optional(),
  reflectionNote: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const partnershipId = url.searchParams.get('partnershipId')

    if (!partnershipId) {
      return NextResponse.json({ error: 'Partnership ID required' }, { status: 400 })
    }

    // Verify user is part of partnership
    const partnership = await prisma.partnership.findFirst({
      where: {
        id: partnershipId,
        OR: [
          { initiatorId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
    })

    if (!partnership) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 })
    }

    const challenges = await prisma.challenge.findMany({
      where: { 
        habit: {
          partnershipId: partnershipId
        }
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true },
        },
        habit: {
          include: {
            partnership: true
          }
        },
        completions: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ challenges })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const habitId = formData.get('habitId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!habitId || !title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has access to this habit
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        partnership: {
          include: {
            initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
            receiver: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    })

    if (!habit) {
      return Response.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Check if user is part of this habit AND if it's their turn
    const isParticipant = 
      habit.createdById === session.user.id ||
      habit.partnership.initiatorId === session.user.id ||
      habit.partnership.receiverId === session.user.id

    if (!isParticipant || habit.status !== 'ACTIVE') {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // NEW: Check if it's the user's turn to set a goal
    if (habit.currentTurn !== session.user.id) {
      const otherPerson = habit.partnership.initiatorId === session.user.id 
        ? habit.partnership.receiver 
        : habit.partnership.initiator
      const otherPersonName = (otherPerson.firstName && otherPerson.lastName) 
        ? `${otherPerson.firstName} ${otherPerson.lastName}`
        : otherPerson.firstName || otherPerson.email
      
      return Response.json({ 
        error: `It's ${otherPersonName}'s turn to set the next goal`,
        notYourTurn: true 
      }, { status: 400 })
    }

    // Check if there's already a challenge for today or if we should create tomorrow's challenge
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0) // Start of today

    // Check for any existing challenge for today for this habit
    const existingTodayChallenge = await prisma.challenge.findFirst({
      where: {
        habitId: habitId,
        dueDate: {
          gte: todayStart,
          lte: today
        }
      },
      include: {
        completions: true
      }
    })

    // If there's a challenge for today, check if both users have completed it
    if (existingTodayChallenge) {
      const userIds = [habit.partnership.initiatorId, habit.partnership.receiverId]
      const completedUserIds = existingTodayChallenge.completions.map((c: any) => c.userId)
      const bothCompleted = userIds.every(id => completedUserIds.includes(id))
      
      console.log('Challenge exists for today:', {
        challengeId: existingTodayChallenge.id,
        userIds,
        completedUserIds, 
        bothCompleted,
        currentUser: session.user.id
      })
      
      if (!bothCompleted) {
        // Check if current user has already completed
        const currentUserCompleted = completedUserIds.includes(session.user.id)
        if (currentUserCompleted) {
          return Response.json({ 
            error: 'Waiting for your buddy to complete today\'s challenge before you can set tomorrow\'s goal',
            needsBuddyCompletion: true 
          }, { status: 400 })
        } else {
          return Response.json({ 
            error: 'Please complete today\'s challenge first',
            needsCompletion: true 
          }, { status: 400 })
        }
      }
      
      // Both completed today's challenge, so create tomorrow's challenge
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(23, 59, 59, 999)
      
      // Check if tomorrow's challenge already exists
      const tomorrowStart = new Date()
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)
      tomorrowStart.setHours(0, 0, 0, 0)
      
      const existingTomorrowChallenge = await prisma.challenge.findFirst({
        where: {
          habitId: habitId,
          dueDate: {
            gte: tomorrowStart,
            lte: tomorrow
          }
        }
      })
      
      if (existingTomorrowChallenge) {
        return Response.json({ error: 'Challenge already exists for tomorrow' }, { status: 400 })
      }
      
      // Create tomorrow's challenge
      const challenge = await prisma.challenge.create({
        data: {
          habitId: habitId,
          creatorId: session.user.id,
          title: title.trim(),
          description: description?.trim() || null,
          dueDate: tomorrow
        }
      })

      // Switch turn to the other person for the day after tomorrow
      const nextTurn = habit.partnership.initiatorId === session.user.id 
        ? habit.partnership.receiverId 
        : habit.partnership.initiatorId

      await prisma.habit.update({
        where: { id: habitId },
        data: { 
          currentTurn: nextTurn, // Switch turn for next goal setting
          updatedAt: new Date()
        }
      })

      return Response.json({ success: true, challengeId: challenge.id })
    }

    // No existing challenge for today, create one
    const challenge = await prisma.challenge.create({
      data: {
        habitId: habitId,
        creatorId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: today
      }
    })

    // Switch turn to the other person for tomorrow's goal setting
    const nextTurn = habit.partnership.initiatorId === session.user.id 
      ? habit.partnership.receiverId 
      : habit.partnership.initiatorId

    await prisma.habit.update({
      where: { id: habitId },
      data: { 
        currentTurn: nextTurn, // Switch turn for tomorrow's goal setting
        updatedAt: new Date()
      }
    })

    return Response.json({ success: true, challengeId: challenge.id })

  } catch (error) {
    console.error('Error creating challenge:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Complete a challenge
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = completeChallengeSchema.parse(body)

    // Verify challenge exists and user is part of partnership
    const challenge = await prisma.challenge.findFirst({
      where: {
        id: data.challengeId,
        habit: {
          partnership: {
            OR: [
              { initiatorId: session.user.id },
              { receiverId: session.user.id },
            ],
          },
        },
      },
      include: {
        habit: {
          include: {
            partnership: true
          }
        }
      },
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Check if already completed by this user
    const existingCompletion = await prisma.challengeCompletion.findUnique({
      where: {
        challengeId_userId: {
          challengeId: data.challengeId,
          userId: session.user.id,
        },
      },
    })

    if (existingCompletion) {
      return NextResponse.json({ error: 'Challenge already completed' }, { status: 400 })
    }

    const completion = await prisma.challengeCompletion.create({
      data: {
        challengeId: data.challengeId,
        userId: session.user.id,
        status: data.status,
        feelingTags: data.feelingTags ? JSON.stringify(data.feelingTags) : null,
        reflectionNote: data.reflectionNote,
      },
    })

    // Update habit streak (not partnership - partnerships don't have currentTurn or streakCount)
    await prisma.habit.update({
      where: { id: challenge.habit.id },
      data: {
        streakCount: data.status === 'COMPLETED' 
          ? { increment: 1 }
          : { set: 0 },
        totalDays: { increment: 1 },
        updatedAt: new Date()
      },
    })

    return NextResponse.json({ completion })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error completing challenge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 