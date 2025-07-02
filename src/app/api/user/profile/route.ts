import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional().or(z.literal('')),
  profilePicture: z.string().url('Invalid URL format').optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
  reminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional().or(z.literal('')),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Handle empty strings by converting to null
    const updateData = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      username: validatedData.username || null,
      profilePicture: validatedData.profilePicture || null,
      timezone: validatedData.timezone,
      reminderTime: validatedData.reminderTime || null,
    }

    // Check if username is taken by another user
    if (updateData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: updateData.username,
          NOT: { id: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        profilePicture: true,
        timezone: true,
        reminderTime: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error updating profile:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        profilePicture: true,
        timezone: true,
        reminderTime: true,
        inviteCode: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 