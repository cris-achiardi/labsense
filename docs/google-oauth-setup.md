# Google OAuth Setup Guide for LabSense

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Name it "LabSense" or similar

## 2. Enable Google+ API

1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

## 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in required information:
   - **App name**: LabSense
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (your email and team emails)

## 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: LabSense Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://your-vercel-domain.vercel.app` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-vercel-domain.vercel.app/api/auth/callback/google` (production)

## 5. Get Client ID and Secret

1. Copy the **Client ID** and **Client Secret**
2. Add them to your `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```

## 6. Update Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Go to **Settings** > **Environment Variables**
3. Add the same Google OAuth credentials
4. Redeploy your application

## 7. Test Authentication

### Local Testing:
1. Start your dev server: `yarn dev`
2. Go to `http://localhost:3000`
3. Click "Iniciar Sesión"
4. Test Google OAuth flow

### Production Testing:
1. Go to your Vercel URL
2. Test the same flow
3. Verify user creation in Supabase

## 8. User Role Management

### Default Behavior:
- New users get `healthcare_worker` role automatically
- First user should be manually promoted to `admin` in Supabase

### Promote User to Admin:
1. Go to Supabase dashboard
2. Open **Table Editor** > **users**
3. Find the user and change `role` to `admin`
4. User will have admin access on next login

## 9. Security Considerations

- Keep Client Secret secure
- Use HTTPS in production
- Regularly rotate credentials
- Monitor OAuth usage in Google Cloud Console
- Review user access regularly

## 10. Troubleshooting

### Common Issues:
- **Redirect URI mismatch**: Check exact URLs in Google Console
- **Client ID not found**: Verify environment variables
- **Access denied**: Check OAuth consent screen configuration
- **Session issues**: Verify NEXTAUTH_SECRET is set

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Check Supabase logs for database errors
4. Review NextAuth debug logs

## Healthcare-Specific Notes

- Only authorized healthcare workers should have access
- Consider adding email domain restrictions
- Implement proper audit logging for compliance
- Regular access reviews for security