import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPartnershipSchema = z.object({
  receiverEmail: z.string().email(),
  habitName: z.string().min(1),
  habitCategory: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKDAYS', 'CUSTOM']).default('DAILY'),
  customDays: z.array(z.number()).optional(),
  duration: z.number().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partnerships = await prisma.partnership.findMany({
      where: {
        OR: [
          { initiatorId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true, image: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, image: true },
        },
        challenges: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            completions: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    return NextResponse.json({ partnerships })
  } catch (error) {
    console.error('Error fetching partnerships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createPartnershipSchema.parse(body)

    // Find receiver by email
    const receiver = await prisma.user.findUnique({
      where: { email: data.receiverEmail },
    })

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (receiver.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot partner with yourself' }, { status: 400 })
    }

    // Check for existing partnership
    const existingPartnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { initiatorId: session.user.id, receiverId: receiver.id },
          { initiatorId: receiver.id, receiverId: session.user.id },
        ],
        status: { in: ['PENDING', 'ACTIVE'] },
      },
    })

    if (existingPartnership) {
      return NextResponse.json({ error: 'Partnership already exists' }, { status: 400 })
    }

    const partnership = await prisma.partnership.create({
      data: {
        initiatorId: session.user.id,
        receiverId: receiver.id,
        habitName: data.habitName,
        habitCategory: data.habitCategory,
        frequency: data.frequency,
        customDays: data.customDays ? JSON.stringify(data.customDays) : null,
        duration: data.duration,
        currentTurn: session.user.id, // Initiator sets first goal
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true, image: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    return NextResponse.json({ partnership })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating partnership:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 