import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/database/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    // Check user_profiles table with admin client
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return NextResponse.json({ error: 'Error fetching user profiles', details: profilesError }, { status: 500 })
    }

    return NextResponse.json({
      user_profiles: profiles,
      count: profiles?.length || 0,
      message: 'Using service role key for admin operations'
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}