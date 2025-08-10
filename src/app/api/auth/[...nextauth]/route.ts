import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'
import type { NextAuthOptions }

// Create a service role client that bypasses RLS for auth operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) from 'next-auth'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists in our user_profiles table (pre-approved users only)
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('email', user.email)
            .single()

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user profile:', fetchError)
            return false
          }

          if (!existingUser) {
            // User not pre-approved - deny access
            console.log('Access denied for non-approved user:', user.email)
            const { data: allUsers } = await supabaseAdmin.from('user_profiles').select('email')
            console.log('Available users in user_profiles:', allUsers)
            return false
          }

          // Update user profile with latest info from Google
          await supabaseAdmin
            .from('user_profiles')
            .update({ 
              name: user.name!,
              image: user.image,
              updated_at: new Date().toISOString()
            })
            .eq('email', user.email)

          return true
        } catch (error) {
          console.error('SignIn error:', error)
          return false
        }
      }
      return false
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // Fetch user data from our user_profiles table
        const { data: dbUser } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single()

        if (dbUser) {
          token.role = dbUser.role
          token.userId = dbUser.id
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token) {
        session.user.role = token.role as string
        session.user.userId = token.userId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign-ins for approved users
      console.log('Successful sign-in for approved user:', user.email)
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes (as per requirements)
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }