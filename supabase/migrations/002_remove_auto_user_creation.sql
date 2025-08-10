-- Remove automatic user creation for security
-- Only pre-approved users should be able to access the system

-- Drop the trigger and function for auto user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Add a policy to prevent unauthorized access
-- Only users that exist in user_profiles can access the system
CREATE POLICY "Only approved users can access" ON user_profiles
  FOR ALL USING (email = auth.jwt() ->> 'email');