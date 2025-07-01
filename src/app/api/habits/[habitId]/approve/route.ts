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

    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "approve" or "reject"' 
      }, { status: 400 })
    }

    // Get the habit and verify permissions
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.habitId,
        status: 'PENDING'
      },
      include: {
        partnership: {
          include: {
            initiator: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } }
          }
        },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    })

    if (!habit) {
      return NextResponse.json({ 
        error: 'Habit not found or not pending approval' 
      }, { status: 404 })
    }

    // Verify the user is part of the partnership and NOT the creator
    const isPartOfPartnership = habit.partnership.initiatorId === session.user.id || 
                                habit.partnership.receiverId === session.user.id
    const isCreator = habit.createdById === session.user.id

    if (!isPartOfPartnership) {
      return NextResponse.json({ 
        error: 'Not authorized to approve this habit' 
      }, { status: 403 })
    }

    if (isCreator) {
      return NextResponse.json({ 
        error: 'Cannot approve your own habit proposal' 
      }, { status: 403 })
    }

    // Update the habit status
    const newStatus = action === 'approve' ? 'ACTIVE' : 'CANCELLED'
    
    const updatedHabit = await prisma.habit.update({
      where: { id: params.habitId },
      data: { 
        status: newStatus,
        // If approved, set the start date to today
        startDate: action === 'approve' ? new Date() : undefined
      },
      include: {
        partnership: {
          include: {
            initiator: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } }
          }
        },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json({ 
      habit: updatedHabit,
      message: action === 'approve' ? 'Habit approved and activated!' : 'Habit proposal rejected'
    })

  } catch (error) {
    console.error('Error processing habit approval:', error)
    return NextResponse.json({ 
      error: 'Failed to process habit approval' 
    }, { status: 500 })
  }
} 