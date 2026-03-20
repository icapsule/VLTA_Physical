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
  id: number
  name: string
  unit: string
  description: string | null
  higher_is_better: boolean
  sort_order: number
  is_active: boolean
}

export interface TestResult {
  id: number
  athlete_id: string
  test_item_id: number
  result_value: number
  test_date: string
  notes: string | null
  coach_feedback: string | null
  created_by: string
  created_at: string
}

export interface TrainingPlan {
  id: number
  coach_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  plan_details: PlanDetails
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PlanAssignment {
  id: number
  plan_id: number
  athlete_id: string
  assigned_at: string
}

export interface PlanProgress {
  id: number
  assignment_id: number
  progress_date: string
  completed: boolean
  notes: string | null
  updated_at: string
}

// JSONB plan_details structure
export interface PlanDetails {
  days: PlanDay[]
}

export interface PlanDay {
  day: number
  label: string
  exercises: Exercise[]
}

export interface Exercise {
  name: string
  sets: number
  reps?: number
  duration_sec?: number
  notes?: string
}

// View: athlete_latest_results
export interface AthleteLatestResult {
  athlete_id: string
  full_name: string
  test_name: string
  unit: string
  higher_is_better: boolean
  result_value: number
  test_date: string
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
      test_items: {
        Row: TestItem
        Insert: Omit<TestItem, 'id'>
        Update: Partial<Omit<TestItem, 'id'>>
        Relationships: []
      }
      test_results: {
        Row: TestResult
        Insert: Omit<TestResult, 'id' | 'created_at'>
        Update: Partial<Omit<TestResult, 'id' | 'created_at'>>
        Relationships: []
      }
      training_plans: {
        Row: TrainingPlan
        Insert: Omit<TrainingPlan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TrainingPlan, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      plan_assignments: {
        Row: PlanAssignment
        Insert: Omit<PlanAssignment, 'id' | 'assigned_at'>
        Update: Partial<Omit<PlanAssignment, 'id' | 'assigned_at'>>
        Relationships: []
      }
      plan_progress: {
        Row: PlanProgress
        Insert: Omit<PlanProgress, 'id' | 'updated_at'>
        Update: Partial<Omit<PlanProgress, 'id' | 'updated_at'>>
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
    Views: {
      athlete_latest_results: {
        Row: AthleteLatestResult
      }
    }
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
