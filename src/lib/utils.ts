import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(date)
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function calculateStreak(completions: Array<{ completedAt: Date, status: string }>): number {
  if (completions.length === 0) return 0
  
  const sortedCompletions = completions
    .filter(c => c.status === 'COMPLETED')
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
  
  if (sortedCompletions.length === 0) return 0
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const completion of sortedCompletions) {
    const completionDate = new Date(completion.completedAt)
    completionDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === streak) {
      streak++
    } else {
      break
    }
  }
  
  return streak
} 