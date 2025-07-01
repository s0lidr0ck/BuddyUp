import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { redirect } from 'next/navigation'

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
      where: { partnershipId },
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        completions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
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
        partnership: true
      }
    })

    if (!habit) {
      return Response.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Check if user is part of this habit
    const isParticipant = 
      habit.createdById === session.user.id ||
      habit.partnership.initiatorId === session.user.id ||
      habit.partnership.receiverId === session.user.id

    if (!isParticipant || habit.status !== 'ACTIVE') {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if there's already a challenge for today
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0) // Start of today

    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        habitId: habitId,
        creatorId: session.user.id,
        dueDate: {
          gte: todayStart,
          lte: today
        }
      }
    })

    if (existingChallenge) {
      return Response.json({ error: 'Challenge already exists for today' }, { status: 400 })
    }

    // Create the challenge
    const challenge = await prisma.challenge.create({
      data: {
        habitId: habitId,
        creatorId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: today
      }
    })

    // Update habit's current turn (for alternating challenge creation)
    const partnerId = habit.partnership.initiatorId === session.user.id 
      ? habit.partnership.receiverId 
      : habit.partnership.initiatorId

    await prisma.habit.update({
      where: { id: habitId },
      data: { 
        currentTurn: partnerId, // Switch turn to buddy for next challenge
        updatedAt: new Date()
      }
    })

    return redirect(`/challenges/${challenge.id}`)

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
        partnership: {
          OR: [
            { initiatorId: session.user.id },
            { receiverId: session.user.id },
          ],
        },
      },
      include: {
        partnership: true,
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

    // Update partnership turn and streak
    const otherUserId = challenge.partnership.initiatorId === session.user.id
      ? challenge.partnership.receiverId
      : challenge.partnership.initiatorId

    await prisma.partnership.update({
      where: { id: challenge.partnershipId },
      data: {
        currentTurn: otherUserId,
        streakCount: data.status === 'COMPLETED' 
          ? { increment: 1 }
          : { set: 0 },
        totalDays: { increment: 1 },
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