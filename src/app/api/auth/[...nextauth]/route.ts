import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabase } from '@/lib/database/supabase'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
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
          // Check if user exists in our database
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError)
            return false
          }

          if (!existingUser) {
            // Create new user with default healthcare_worker role
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                email: user.email!,
                name: user.name!,
                role: 'healthcare_worker',
                healthcare_role: null,
                last_login: new Date().toISOString(),
              })

            if (insertError) {
              console.error('Error creating user:', insertError)
              return false
            }

            // Log the signup event
            await supabase
              .from('audit_logs')
              .insert({
                user_id: null, // Will be updated after user creation
                action: 'user_signup',
                resource_type: 'user',
                resource_id: null,
                ip_address: null,
                user_agent: null,
              })
          } else {
            // Update last login
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('email', user.email)

            // Log the login event
            await supabase
              .from('audit_logs')
              .insert({
                user_id: existingUser.id,
                action: 'user_login',
                resource_type: 'user',
                resource_id: existingUser.id,
                ip_address: null,
                user_agent: null,
              })
          }

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
        // Fetch user data from our database
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single()

        if (dbUser) {
          token.role = dbUser.role
          token.healthcareRole = dbUser.healthcare_role
          token.userId = dbUser.id
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token) {
        session.user.role = token.role as string
        session.user.healthcareRole = token.healthcareRole as string
        session.user.userId = token.userId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes (as per requirements)
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }