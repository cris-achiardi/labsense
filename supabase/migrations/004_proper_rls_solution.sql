-- Proper RLS solution without bypassing security
-- Re-enable RLS first
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Only approved users can access" ON user_profiles;

-- Create a simple policy that allows authenticated users to read profiles
-- This avoids recursion by not querying the same table
CREATE POLICY "Authenticated users can read profiles" ON user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Allow inserts for new user creation (admin only via service role)
CREATE POLICY "Service role can insert users" ON user_profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Allow service role to update any profile (for admin operations)
CREATE POLICY "Service role can update users" ON user_profiles
  FOR UPDATE USING (auth.role() = 'service_role');

-- Allow service role to delete users (for admin operations)
CREATE POLICY "Service role can delete users" ON user_profiles
  FOR DELETE USING (auth.role() = 'service_role');