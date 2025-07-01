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

    const partnership = await prisma.partnership.findFirst({
      where: {
        id: params.partnershipId,
        OR: [
          { initiatorId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true }
        },
        receiver: {
          select: { id: true, name: true, email: true }
        },
        habits: {
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!partnership) {
      return NextResponse.json({ 
        error: 'Partnership not found or access denied' 
      }, { status: 404 })
    }

    return NextResponse.json({ partnership })

  } catch (error) {
    console.error('Error fetching partnership:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch partnership' 
    }, { status: 500 })
  }
} 