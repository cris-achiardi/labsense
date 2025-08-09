# LabSense Setup Guide

## 1. Supabase Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a region close to Chile (São Paulo recommended)
4. Wait for project to be ready

### Database Setup
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `docs/database-schema.sql`
3. Run the SQL to create all tables and policies

### Get API Keys
1. Go to Settings > API
2. Copy the Project URL and anon public key
3. Copy the service_role secret key (for server-side operations)

## 2. Google OAuth Setup

### Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret

## 3. Environment Variables

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

## 4. Vercel Deployment

### Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

### Environment Variables
1. In Vercel dashboard, go to Settings > Environment Variables
2. Add all the same variables from `.env.local`
3. Update `NEXTAUTH_URL` to your Vercel domain

### Deploy
1. Push to main branch
2. Vercel will automatically deploy
3. Update Google OAuth redirect URI to include Vercel domain

## 5. Testing

### Local Testing
```bash
yarn dev
```

### Verify Setup
1. Homepage loads with Radix UI theme
2. Google OAuth login works
3. Database connection successful
4. PDF upload to Supabase Storage works

## 6. Chilean Healthcare Data

### Test with Real Data
1. Use the PDF sample in `docs/pdf-sample/` (git ignored)
2. Test RUT validation with Chilean format
3. Verify Spanish medical terminology parsing
4. Confirm priority scoring with real patient data

## Security Notes

- Never commit `.env.local` to git
- Use Row Level Security policies in production
- Enable 2FA on Supabase and Vercel accounts
- Regularly rotate API keys
- Monitor audit logs for suspicious activity