import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { partnershipId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is part of this partnership
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
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 })
    }

    // Get all timeline data in parallel
    const [messages, habits, challenges, challengeCompletions] = await Promise.all([
      // Messages
      prisma.message.findMany({
        where: { partnershipId: params.partnershipId },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } }
        }
      }),
      
      // Habits (for creation/approval events)
      prisma.habit.findMany({
        where: { partnershipId: params.partnershipId },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } }
        }
      }),
      
      // Challenges (for goal setting events)
      prisma.challenge.findMany({
        where: {
          habit: { partnershipId: params.partnershipId }
        },
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } },
          habit: { select: { id: true, name: true } }
        }
      }),
      
      // Challenge completions
      prisma.challengeCompletion.findMany({
        where: {
          challenge: {
            habit: { partnershipId: params.partnershipId }
          }
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true } },
          challenge: {
            include: {
              habit: { select: { id: true, name: true } }
            }
          }
        }
      })
    ])

    // Create timeline items
    const timelineItems: any[] = []

    // Add messages
    messages.forEach(message => {
      timelineItems.push({
        id: `message-${message.id}`,
        type: 'message',
        timestamp: message.createdAt,
        data: message
      })
    })

    // Add habit creation events
    habits.forEach(habit => {
      timelineItems.push({
        id: `habit-created-${habit.id}`,
        type: 'habit_created',
        timestamp: habit.createdAt,
        data: habit
      })

      // Add habit approval event if it was approved
      if (habit.status === 'ACTIVE' && habit.startDate) {
        timelineItems.push({
          id: `habit-approved-${habit.id}`,
          type: 'habit_approved', 
          timestamp: habit.startDate,
          data: habit
        })
      }
    })

    // Add challenge creation events (goal setting)
    challenges.forEach(challenge => {
      timelineItems.push({
        id: `challenge-created-${challenge.id}`,
        type: 'goal_set',
        timestamp: challenge.createdAt,
        data: challenge
      })
    })

    // Add challenge completion events
    challengeCompletions.forEach(completion => {
      timelineItems.push({
        id: `completion-${completion.id}`,
        type: 'goal_completed',
        timestamp: completion.completedAt,
        data: completion
      })
    })

    // Sort by timestamp (oldest first, newest at bottom for chat-like experience)
    timelineItems.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return NextResponse.json({ 
      partnership,
      timeline: timelineItems 
    })

  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 