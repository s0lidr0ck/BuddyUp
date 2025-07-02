// Notification types for the PWA system
// This will be replaced by Prisma generated types once client is regenerated

export type NotificationType = 
  | 'BUDDY_INVITE_RECEIVED'
  | 'BUDDY_INVITE_ACCEPTED'
  | 'GOAL_SET_FOR_YOU'
  | 'GOAL_COMPLETED_BY_BUDDY'
  | 'HABIT_NEEDS_APPROVAL'
  | 'HABIT_APPROVED'
  | 'HABIT_REJECTED'
  | 'NEW_MESSAGE'
  | 'STREAK_REMINDER'
  | 'WEEKLY_PROGRESS'
  | 'TURN_TO_SET_GOAL'
  | 'PARTNERSHIP_PAUSED'
  | 'PARTNERSHIP_RESUMED'

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

export interface NotificationSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
} 