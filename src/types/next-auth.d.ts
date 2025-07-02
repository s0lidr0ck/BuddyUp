import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      firstName?: string | null
      lastName?: string | null
      profilePicture?: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    firstName?: string | null
    lastName?: string | null
    profilePicture?: string | null
  }
} 