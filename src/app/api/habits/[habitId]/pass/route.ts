import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { habitId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const habitId = params.habitId
    const userId = session.user.id

    // Get the habit with partnership info
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
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Verify the user is part of this partnership
    const isPartOfPartnership = habit.partnership.initiatorId === userId || habit.partnership.receiverId === userId
    if (!isPartOfPartnership) {
      return NextResponse.json({ error: 'Not authorized for this habit' }, { status: 403 })
    }

    // Verify it's the user's turn
    if (habit.currentTurn !== userId) {
      return NextResponse.json({ error: 'It\'s not your turn to set a goal' }, { status: 400 })
    }

    // Determine the buddy (the other person in the partnership)
    const buddyId = habit.partnership.initiatorId === userId 
      ? habit.partnership.receiverId 
      : habit.partnership.initiatorId
    
    const buddy = habit.partnership.initiatorId === userId 
      ? habit.partnership.receiver 
      : habit.partnership.initiator

    // Update the habit to pass the turn
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        currentTurn: buddyId, // Pass turn to buddy
        lastPassedBy: userId,
        passedAt: new Date(),
        passCount: { increment: 1 }
      }
    })

    // Send a system message to notify about the pass
    await prisma.message.create({
      data: {
        partnershipId: habit.partnershipId,
        senderId: userId,
        content: `passed their turn to set the next goal for "${habit.name}". Your turn to set the goal!`,
        messageType: 'SYSTEM'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Turn passed to ${buddy.firstName || buddy.email}`,
      passCount: updatedHabit.passCount 
    })

  } catch (error) {
    console.error('Error passing turn:', error)
    return NextResponse.json(
      { error: 'Failed to pass turn. Please try again.' },
      { status: 500 }
    )
  }
} 