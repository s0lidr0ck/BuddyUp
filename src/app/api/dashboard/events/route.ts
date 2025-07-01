import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id

  // Set up Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`))

      // Check for updates every 5 seconds
      const interval = setInterval(async () => {
        try {
          // Check for updates in the last 6 seconds (slightly longer than interval)
          const since = new Date(Date.now() - 6000)
          
          const [updatedHabits, updatedPartnerships] = await Promise.all([
            prisma.habit.findMany({
              where: {
                updatedAt: { gte: since },
                OR: [
                  { createdById: userId },
                  {
                    partnership: {
                      OR: [
                        { initiatorId: userId },
                        { receiverId: userId }
                      ]
                    }
                  }
                ]
              },
              select: { 
                id: true, 
                status: true, 
                updatedAt: true,
                name: true,
                createdBy: {
                  select: { name: true, email: true }
                }
              }
            }),

            prisma.partnership.findMany({
              where: {
                updatedAt: { gte: since },
                OR: [
                  { initiatorId: userId },
                  { receiverId: userId }
                ]
              },
              select: { 
                id: true, 
                status: true, 
                updatedAt: true 
              }
            })
          ])

          if (updatedHabits.length > 0 || updatedPartnerships.length > 0) {
            const updateMessage = {
              type: 'update',
              timestamp: Date.now(),
              data: {
                habits: updatedHabits,
                partnerships: updatedPartnerships
              }
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(updateMessage)}\n\n`))
          }

          // Send heartbeat every 30 seconds to keep connection alive
          if (Date.now() % 30000 < 5000) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`))
          }

        } catch (error) {
          console.error('Error in SSE stream:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`))
        }
      }, 5000)

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
} 