# LabSense Setup Guide

## Current Status: Phase 1 Complete ✅

**Live Production:** https://labsense.vercel.app/  
**Authentication:** Google OAuth with admin panel  
**Database:** Supabase with proper RLS policies  
**Admin Users:** Pre-approved access only  

## 1. Supabase Setup ✅

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a region close to Chile (São Paulo recommended)
4. Wait for project to be ready

### Database Setup ✅
1. Go to SQL Editor in your Supabase dashboard
2. Run the migrations from `supabase/migrations/` in order:
   - `001_create_user_profiles.sql` - Creates user profiles table with admin users
   - `002_remove_auto_user_creation.sql` - Removes auto-creation for security
   - `003_fix_rls_policies.sql` - Fixes RLS infinite recursion issues
   - `004_proper_rls_solution.sql` - Implements proper RLS without bypassing

**Current Schema:**
- ✅ `user_profiles` table with admin/healthcare_worker roles
- ✅ Proper RLS policies using `auth.role()` (no recursion)
- ✅ Admin users: Cristian Morales, Julissa Rodriguez
- ✅ Pre-approved user system (no auto-registration)

### Get API Keys
1. Go to Settings > API
2. Copy the Project URL and anon public key
3. Copy the service_role secret key (for server-side operations)

## 2. Google OAuth Setup ✅

### Create Google OAuth App ✅
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://labsense.vercel.app/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret

**Current Status:** ✅ Configured and working in production

## 3. Environment Variables ✅

### Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in all the values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

## 4. Vercel Deployment ✅

### Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

### Environment Variables
1. In Vercel dashboard, go to Settings > Environment Variables
2. Add all the same variables from `.env.local`
3. Update `NEXTAUTH_URL` to your Vercel domain

### Deploy ✅
1. Push to main branch
2. Vercel will automatically deploy
3. Update Google OAuth redirect URI to include Vercel domain

**Current Status:** ✅ Live at https://labsense.vercel.app/  
**CI/CD:** ✅ Automatic deployments from main branch  
**SSL:** ✅ HTTPS enabled with custom domain ready

## 5. Testing ✅

### Local Testing
```bash
yarn dev
```

### Verify Setup ✅
1. ✅ Homepage loads with Radix UI theme (mint accent, full radius)
2. ✅ Google OAuth login works (NextAuth.js integration)
3. ✅ Database connection successful (Supabase with RLS)
4. ✅ Admin panel functional (/admin/users)
5. ✅ User management working (pre-approved users only)
6. ✅ Spanish language interface
7. ✅ Material Symbols icons
8. ✅ Session management (30-minute timeout)
9. ✅ Secure logout functionality
10. ✅ Anonymized demo data (/demo)

## 6. Current System Features ✅

### Authentication & Security
- ✅ **Google OAuth** with NextAuth.js
- ✅ **Role-based access** (admin vs healthcare worker)
- ✅ **Pre-approved users only** (no auto-registration)
- ✅ **Session management** (30-minute timeout)
- ✅ **Audit logging** (login/logout events)
- ✅ **Row Level Security** (proper policies without bypassing)

### User Interface
- ✅ **Spanish language** interface for Chilean healthcare workers
- ✅ **Radix UI Themes** with mint accent and healthcare styling
- ✅ **Material Symbols** icons for consistent UI
- ✅ **Dashboard topbar** with user info and logout
- ✅ **Responsive design** for mobile and desktop

### Admin Features
- ✅ **Admin panel** at `/admin` (admin-only access)
- ✅ **User management** at `/admin/users`
- ✅ **Real-time user creation** through admin interface
- ✅ **Role assignment** (admin/healthcare_worker)

### Data Privacy
- ✅ **Protected homepage** (requires authentication)
- ✅ **Public demo** with anonymized data (`***` names, `**.***.**-*` RUTs)
- ✅ **No real patient data** exposed publicly
- ✅ **Healthcare-grade security** practices

## 7. Next Phase: PDF Processing

### Ready to Implement
- 📋 **PDF upload system** with file validation
- 📋 **Chilean RUT parsing** with validation algorithm
- 📋 **Spanish health marker extraction** patterns documented
- 📋 **Priority scoring algorithm** validated with real patient case
- 📋 **Database schema** for patients and lab results

## Security Notes

- Never commit `.env.local` to git
- Use Row Level Security policies in production
- Enable 2FA on Supabase and Vercel accounts
- Regularly rotate API keys
- Monitor audit logs for suspicious activity