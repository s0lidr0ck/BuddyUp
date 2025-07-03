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
    const { subscription, userAgent } = body

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    // Save subscription to database
    console.log('Push subscription received for user:', session.user.id)
    
    try {
      await prisma.notificationSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true,
          lastUsed: new Date(),
        },
        create: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
        },
      })
      console.log('Successfully saved push subscription to database')
    } catch (dbError) {
      console.error('Failed to save subscription to database:', dbError)
      // Continue anyway - the subscription might still work
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 