import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, frequency, partnershipId, duration } = body

    // Validate required fields
    if (!name || !category || !frequency || !partnershipId) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, category, frequency, partnershipId' 
      }, { status: 400 })
    }

    // Verify user is part of the partnership
    const partnership = await prisma.partnership.findFirst({
      where: {
        id: partnershipId,
        OR: [
          { initiatorId: session.user.id },
          { receiverId: session.user.id }
        ],
        status: 'ACTIVE'
      }
    })

    if (!partnership) {
      return NextResponse.json({ 
        error: 'Partnership not found or not authorized' 
      }, { status: 403 })
    }

    // Calculate end date if duration is provided
    let endDate = null
    if (duration && duration > 0) {
      endDate = new Date()
      endDate.setDate(endDate.getDate() + duration)
    }

    // Determine whose turn it is first (creator gets first turn)
    const currentTurn = session.user.id

    // Create the habit
    const habit = await prisma.habit.create({
      data: {
        name,
        description: description || null,
        category,
        frequency,
        duration: duration || null,
        endDate,
        partnershipId,
        createdById: session.user.id,
        currentTurn,
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

    return NextResponse.json({ habit }, { status: 201 })

  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json({ 
      error: 'Failed to create habit' 
    }, { status: 500 })
  }
} 