import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationHelpers } from '@/lib/notifications'
import { formatUserName } from '@/lib/utils'

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
      }
    })

    if (!partnership) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 })
    }

    // Get messages for this partnership
    const messages = await prisma.message.findMany({
      where: { partnershipId: params.partnershipId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { partnershipId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, messageType = 'TEXT' } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify user is part of this partnership and get user details
    const partnership = await prisma.partnership.findFirst({
      where: {
        id: params.partnershipId,
        OR: [
          { initiatorId: session.user.id },
          { receiverId: session.user.id }
        ],
        status: 'ACTIVE'
      },
      include: {
        initiator: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        }
      }
    })

    if (!partnership) {
      return NextResponse.json({ error: 'Partnership not found or not active' }, { status: 404 })
    }

    // Determine who is the receiver (the other person in the partnership)
    const receiverId = partnership.initiatorId === session.user.id 
      ? partnership.receiverId 
      : partnership.initiatorId
    
    const sender = partnership.initiatorId === session.user.id 
      ? partnership.initiator 
      : partnership.receiver

    // Create the message
    const message = await prisma.message.create({
      data: {
        partnershipId: params.partnershipId,
        senderId: session.user.id,
        content: content.trim(),
        messageType
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        }
      }
    })

    // Send notification to the receiver
    try {
      const senderName = formatUserName(sender)
      console.log('Sending notification to user:', receiverId, 'from:', senderName)
      await NotificationHelpers.newMessage(receiverId, senderName, params.partnershipId)
      console.log('Notification sent successfully')
    } catch (error) {
      console.error('Failed to send message notification:', error)
      // Don't fail the message creation if notification fails
    }

    return NextResponse.json({ message }, { status: 201 })

  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 