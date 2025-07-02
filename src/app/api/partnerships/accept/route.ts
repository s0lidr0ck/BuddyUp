import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviterId } = await request.json()

    if (!inviterId) {
      return NextResponse.json({ error: 'Inviter ID required' }, { status: 400 })
    }

    // Check if inviter exists
    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
    })

    if (!inviter) {
      return NextResponse.json({ error: 'Inviter not found' }, { status: 404 })
    }

    // Check if they're trying to invite themselves
    if (session.user.id === inviterId) {
      return NextResponse.json({ error: 'Cannot create partnership with yourself' }, { status: 400 })
    }

    // Check if partnership already exists
    const existingPartnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { initiatorId: inviterId, receiverId: session.user.id },
          { initiatorId: session.user.id, receiverId: inviterId }
        ]
      }
    })

    if (existingPartnership) {
      return NextResponse.json({ error: 'You are already buddies!' }, { status: 400 })
    }

    // Create the partnership
    const partnership = await prisma.partnership.create({
      data: {
        initiatorId: inviterId,
        receiverId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        initiator: {
          select: { firstName: true, lastName: true, email: true, profilePicture: true }
        },
        receiver: {
          select: { firstName: true, lastName: true, email: true, profilePicture: true }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      partnership,
      message: 'Successfully connected as buddies!'
    })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 