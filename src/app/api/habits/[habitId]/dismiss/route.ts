import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    const { habitId } = params

    // First, check if the habit exists and get its details
    const existingHabit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: {
        id: true,
        status: true,
        createdById: true,
        dismissedAt: true,
      }
    })

    if (!existingHabit) {
      console.error(`Habit not found: ${habitId}`)
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Check if user has permission to dismiss this habit
    if (existingHabit.createdById !== session.user.id) {
      console.error(`User ${session.user.id} cannot dismiss habit ${habitId} created by ${existingHabit.createdById}`)
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update the habit to mark it as dismissed
    const habit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        dismissedAt: new Date(),
      },
    })

    console.log(`Habit ${habitId} dismissed by user ${session.user.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error dismissing habit:', error)
    return NextResponse.json(
      { error: 'Failed to dismiss habit notification' },
      { status: 500 }
    )
  }
} 