import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // If user exists but has no password (created via magic link), upgrade them
      if (!existingUser.password) {
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const updatedUser = await prisma.user.update({
          where: { email },
          data: {
            name,
            password: hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          }
        })

        return NextResponse.json({
          message: 'Account upgraded successfully! You can now sign in with your password.',
          user: updatedUser
        })
      } else {
        // User exists and already has a password
        return NextResponse.json(
          { error: 'User with this email already exists and has a password. Try signing in instead.' },
          { status: 400 }
        )
      }
    }

    // Hash password for new user
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      message: 'User created successfully',
      user
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 