export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          fighter_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          fighter_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fighter_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      day_plans: {
        Row: {
          id: string
          user_id: string
          date: string
          priorities: Json
          brain_dump: string
          schedule: Json
          tracker: Json
          manual_plans: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          priorities?: Json
          brain_dump?: string
          schedule?: Json
          tracker?: Json
          manual_plans?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          priorities?: Json
          brain_dump?: string
          schedule?: Json
          tracker?: Json
          manual_plans?: Json
          created_at?: string
          updated_at?: string
        }
      }
      weekly_plans: {
        Row: {
          id: string
          user_id: string
          week_start: string
          priorities: Json
          brain_dump: string
          tracker: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          priorities?: Json
          brain_dump?: string
          tracker?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          priorities?: Json
          brain_dump?: string
          tracker?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

