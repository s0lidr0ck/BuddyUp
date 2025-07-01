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

    const { receiverEmail, inviteCode } = await request.json()

    if (!receiverEmail || !inviteCode) {
      return NextResponse.json({ error: 'Email and invite code required' }, { status: 400 })
    }

    // Get the inviting user's info
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true }
    })

    if (!inviter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // TODO: Here you would integrate with your email service (SendGrid, etc.)
    // For now, we'll just simulate sending the email
    
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${inviteCode}`
    
    console.log(`EMAIL INVITE SENT:
    To: ${receiverEmail}
    From: ${inviter.name || inviter.email}
    Invite Link: ${inviteUrl}
    `)

    // In a real implementation, you'd send an email here like:
    /*
    await sendEmail({
      to: receiverEmail,
      subject: `${inviter.name} wants to be your BuddyUp buddy!`,
      html: `
        <h1>You're invited to join BuddyUp!</h1>
        <p>${inviter.name} wants to be your buddy and build great habits together.</p>
        <a href="${inviteUrl}">Accept Invitation</a>
      `
    })
    */

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully'
    })

  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 