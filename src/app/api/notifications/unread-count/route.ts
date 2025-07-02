import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return 0 until Prisma client is regenerated
    let count = 0
    
    /* 
    When Prisma client is regenerated, use:
    count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    })
    */

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 