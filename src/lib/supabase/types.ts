/**
 * Database types for VLTA Physical Training System.
 *
 * NOTE: This file should be regenerated from Supabase after running migrations:
 * npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/lib/supabase/types.ts
 *
 * Until then, manual types are defined below to match the schema in 001_initial_schema.sql.
 */

export type UserRole = 'athlete' | 'coach' | 'admin'
export type Gender = 'male' | 'female' | 'other'

export interface Profile {
  id: string
  full_name: string
  username: string | null
  phone: string | null
  gender: Gender | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface TestItem {
  id: string
  name_zh: string
  dimension: string
  unit: string
  higher_is_better: boolean
  record_type: 'test' | 'training'
  in_radar: boolean
  reg_base_min?: number | null
  reg_base_max?: number | null
  reg_growth_min?: number | null
  reg_growth_max?: number | null
  elite_base_min?: number | null
  elite_base_max?: number | null
  elite_growth_min?: number | null
  elite_growth_max?: number | null
  scoring_matrix: Record<string, any> | null
}

// Database interface for typed Supabase client
// @supabase/supabase-js v2 requires PostgrestVersion at the public schema level
export interface Database {
  public: {
    PostgrestVersion: '12'
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      test_metrics: {
        Row: TestItem
        Insert: Omit<TestItem, 'id'>
        Update: Partial<Omit<TestItem, 'id'>>
        Relationships: []
      }
      coach_athlete_assignments: {
        Row: {
          id: number
          coach_id: string
          athlete_id: string
          assigned_at: string
        }
        Insert: { coach_id: string; athlete_id: string }
        Update: {
          coach_id?: string
          athlete_id?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      get_my_role: {
        Args: Record<never, never>
        Returns: UserRole
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
