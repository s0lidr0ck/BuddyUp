import { prisma } from './prisma'
import { NotificationType } from '@prisma/client'

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  data?: Record<string, any>
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  data?: Record<string, any>
}

export interface WebPushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// VAPID keys for web push (generate with: npx web-push generate-vapid-keys)
// In production, these should be stored in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:support@buddyup.app'

let webpush: any
if (typeof window === 'undefined') {
  // Only import web-push on server side
  try {
    webpush = require('web-push')
    console.log('web-push imported successfully')
    console.log('VAPID_PUBLIC_KEY:', VAPID_PUBLIC_KEY ? 'Set' : 'Missing')
    console.log('VAPID_PRIVATE_KEY:', VAPID_PRIVATE_KEY ? 'Set' : 'Missing')
    console.log('VAPID_EMAIL:', VAPID_EMAIL)
    
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
      console.log('VAPID details set successfully')
    } else {
      console.warn('Missing VAPID keys - push notifications will not work')
    }
  } catch (error: any) {
    console.warn('web-push not available:', error.message)
  }
}

export class NotificationService {
  /**
   * Create a new notification in the database
   */
  static async createNotification(data: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          data: data.data ? JSON.stringify(data.data) : null,
        },
      })

      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  /**
   * Send a push notification to a user
   */
  static async sendPushNotification(userId: string, payload: PushNotificationPayload) {
    console.log('sendPushNotification called for user:', userId)
    
    if (!webpush) {
      console.warn('Web push not configured - webpush object is null')
      return
    }

    try {
      // Get user's push subscriptions
      const subscriptions = await prisma.notificationSubscription.findMany({
        where: {
          userId,
          isActive: true,
        },
      })

      console.log('Found', subscriptions.length, 'active subscriptions for user:', userId)

      if (subscriptions.length === 0) {
        console.log('No active push subscriptions for user:', userId)
        return
      }

      // Check user's notification preferences
      const preferences = await this.getNotificationPreferences(userId)
      console.log('User notification preferences:', { pushEnabled: preferences.pushEnabled, newMessages: preferences.newMessages })
      
      if (!preferences.pushEnabled) {
        console.log('Push notifications disabled for user:', userId)
        return
      }

      // Send to all active subscriptions
      const pushPromises = subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          }

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          )

          // Update last used timestamp
          await prisma.notificationSubscription.update({
            where: { id: subscription.id },
            data: { lastUsed: new Date() },
          })
                 } catch (error: any) {
           console.error('Failed to send push notification:', error)
           
           // Deactivate subscription if it's invalid
           if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.notificationSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            })
          }
        }
      })

      await Promise.allSettled(pushPromises)
    } catch (error) {
      console.error('Error sending push notifications:', error)
    }
  }

  /**
   * Send both in-app and push notification
   */
  static async sendNotification(notificationData: NotificationData, pushPayload?: PushNotificationPayload) {
    // Create in-app notification
    const notification = await this.createNotification(notificationData)

    // Send push notification if payload provided
    if (pushPayload) {
      await this.sendPushNotification(notificationData.userId, {
        ...pushPayload,
        data: { notificationId: notification.id, ...pushPayload.data },
      })
    }

    return notification
  }

  /**
   * Get user's notification preferences
   */
  static async getNotificationPreferences(userId: string) {
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId },
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: { userId },
      })
    }

    return preferences
  }

  /**
   * Update user's notification preferences
   */
  static async updateNotificationPreferences(userId: string, updates: any) {
    return prisma.notificationPreferences.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...updates },
    })
  }

  /**
   * Subscribe user to push notifications
   */
  static async subscribeToPush(userId: string, subscription: WebPushSubscription, userAgent?: string) {
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
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
        },
      })

      return true
    } catch (error) {
      console.error('Failed to save push subscription:', error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPush(endpoint: string) {
    try {
      await prisma.notificationSubscription.update({
        where: { endpoint },
        data: { isActive: false },
      })
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error)
      return false
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })
      return true
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  }

  /**
   * Get unread notifications for user
   */
  static async getUnreadNotifications(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get all notifications for user (paginated)
   */
  static async getNotifications(userId: string, skip = 0, take = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })
  }

  /**
   * Get notification count
   */
  static async getNotificationCount(userId: string, unreadOnly = false) {
    return prisma.notification.count({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
    })
  }
}

// Helper functions for specific notification types
export const NotificationHelpers = {
  async buddyInviteReceived(receiverId: string, inviterName: string) {
    await NotificationService.sendNotification(
      {
        userId: receiverId,
        type: 'BUDDY_INVITE_RECEIVED',
        title: 'New Buddy Invitation! 👋',
        message: `${inviterName} wants to be your accountability buddy`,
        actionUrl: '/buddies',
      },
      {
        title: 'New Buddy Invitation! 👋',
        body: `${inviterName} wants to be your accountability buddy`,
        tag: 'buddy-invite',
        url: '/buddies',
        actions: [
          { action: 'view', title: 'View Invite' },
          { action: 'dismiss', title: 'Later' },
        ],
      }
    )
  },

  async goalCompleted(buddyId: string, completedByName: string, goalTitle: string) {
    await NotificationService.sendNotification(
      {
        userId: buddyId,
        type: 'GOAL_COMPLETED_BY_BUDDY',
        title: '🎉 Goal Completed!',
        message: `${completedByName} completed: "${goalTitle}"`,
        actionUrl: '/dashboard',
      },
      {
        title: '🎉 Goal Completed!',
        body: `${completedByName} completed: "${goalTitle}"`,
        tag: 'goal-completed',
        url: '/dashboard',
        actions: [
          { action: 'view', title: 'View Details' },
          { action: 'celebrate', title: 'Celebrate 🎉' },
        ],
      }
    )
  },

  async newMessage(receiverId: string, senderName: string, partnershipId: string) {
    await NotificationService.sendNotification(
      {
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: `💬 Message from ${senderName}`,
        message: 'You have a new message from your buddy',
        actionUrl: `/partnerships/${partnershipId}/chat`,
      },
      {
        title: `💬 ${senderName}`,
        body: 'You have a new message from your buddy',
        tag: 'new-message',
        url: `/partnerships/${partnershipId}/chat`,
        actions: [
          { action: 'view', title: 'Reply' },
          { action: 'dismiss', title: 'Later' },
        ],
      }
    )
  },

  async turnToSetGoal(userId: string, habitName: string) {
    await NotificationService.sendNotification(
      {
        userId,
        type: 'TURN_TO_SET_GOAL',
        title: "🎯 Your Turn to Set Today's Goal!",
        message: `Set a goal for "${habitName}"`,
        actionUrl: '/dashboard',
      },
      {
        title: "🎯 Your Turn!",
        body: `Set a goal for "${habitName}"`,
        tag: 'turn-to-set-goal',
        url: '/dashboard',
        actions: [
          { action: 'view', title: 'Set Goal' },
          { action: 'dismiss', title: 'Later' },
        ],
      }
    )
  },
}

export { VAPID_PUBLIC_KEY } 