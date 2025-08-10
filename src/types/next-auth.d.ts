import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      healthcareRole?: string | null
      userId: string
    }
  }

  interface User {
    role?: string
    healthcareRole?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    healthcareRole?: string | null
    userId?: string
  }
}