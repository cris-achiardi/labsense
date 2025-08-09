import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type-safe database types will be generated here
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'healthcare_worker' | 'admin'
          healthcare_role: string | null
          created_at: string
          last_login: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'healthcare_worker' | 'admin'
          healthcare_role?: string | null
          created_at?: string
          last_login?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'healthcare_worker' | 'admin'
          healthcare_role?: string | null
          created_at?: string
          last_login?: string | null
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          rut: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          rut: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          rut?: string
          created_at?: string
          updated_at?: string
        }
      }
      lab_reports: {
        Row: {
          id: string
          patient_id: string
          uploaded_by: string
          pdf_url: string
          test_date: string | null
          laboratory_name: string | null
          priority_score: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          uploaded_by: string
          pdf_url: string
          test_date?: string | null
          laboratory_name?: string | null
          priority_score?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          uploaded_by?: string
          pdf_url?: string
          test_date?: string | null
          laboratory_name?: string | null
          priority_score?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}