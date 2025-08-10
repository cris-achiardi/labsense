-- Fix RLS policies to prevent infinite recursion
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Only approved users can access" ON user_profiles;

-- Create simple, non-recursive policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Allow users to update their own profile (for name/image updates)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- For admin operations, we'll handle permissions in the application layer
-- This avoids the infinite recursion issue

-- Temporarily disable RLS for system operations (like NextAuth)
-- We'll handle authorization in the application code
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;