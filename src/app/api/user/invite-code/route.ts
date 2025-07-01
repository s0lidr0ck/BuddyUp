import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { inviteCode: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user doesn't have an invite code, generate one
    if (!user.inviteCode) {
      const { randomBytes } = await import('crypto')
      const inviteCode = randomBytes(4).toString('hex').toUpperCase()
      
      user = await prisma.user.update({
        where: { id: session.user.id },
        data: { inviteCode },
        select: { inviteCode: true }
      })
    }

    return NextResponse.json({ inviteCode: user.inviteCode })
  } catch (error) {
    console.error('Error fetching invite code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 