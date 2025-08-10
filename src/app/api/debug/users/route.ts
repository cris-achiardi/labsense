import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/database/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return NextResponse.json({ error: 'Error fetching user profiles', details: profilesError }, { status: 500 })
    }

    return NextResponse.json({
      user_profiles: profiles,
      count: profiles?.length || 0
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}