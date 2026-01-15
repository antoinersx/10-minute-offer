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
          email: string | null
          plan: 'free' | 'pro'
          stripe_customer_id: string | null
          generations_this_month: number
          billing_cycle_start: string | null
          onboarding_complete: boolean
          business_name: string | null
          business_description: string | null
          target_avatar: string | null
          price_range: string | null
          competitors: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          generations_this_month?: number
          billing_cycle_start?: string | null
          onboarding_complete?: boolean
          business_name?: string | null
          business_description?: string | null
          target_avatar?: string | null
          price_range?: string | null
          competitors?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          generations_this_month?: number
          billing_cycle_start?: string | null
          onboarding_complete?: boolean
          business_name?: string | null
          business_description?: string | null
          target_avatar?: string | null
          price_range?: string | null
          competitors?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          business_description: string | null
          avatar_description: string | null
          deep_research: boolean
          status: 'draft' | 'generating' | 'complete' | 'failed' | 'partial'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          business_description?: string | null
          avatar_description?: string | null
          deep_research?: boolean
          status?: 'draft' | 'generating' | 'complete' | 'failed' | 'partial'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          business_description?: string | null
          avatar_description?: string | null
          deep_research?: boolean
          status?: 'draft' | 'generating' | 'complete' | 'failed' | 'partial'
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          project_id: string
          doc_type: 'market-research' | 'avatar-complete' | 'big-idea' | 'value-ladder' | 'avatar-validation' | 'landing-page-copy' | 'implementation-checklist'
          doc_number: 3 | 4 | 5 | 6 | 7 | 10 | 14
          title: string
          content: string | null
          status: 'pending' | 'generating' | 'complete'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          doc_type: 'market-research' | 'avatar-complete' | 'big-idea' | 'value-ladder' | 'avatar-validation' | 'landing-page-copy' | 'implementation-checklist'
          doc_number: 3 | 4 | 5 | 6 | 7 | 10 | 14
          title: string
          content?: string | null
          status?: 'pending' | 'generating' | 'complete'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          doc_type?: 'market-research' | 'avatar-complete' | 'big-idea' | 'value-ladder' | 'avatar-validation' | 'landing-page-copy' | 'implementation-checklist'
          doc_number?: 3 | 4 | 5 | 6 | 7 | 10 | 14
          title?: string
          content?: string | null
          status?: 'pending' | 'generating' | 'complete'
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          project_id: string
          started_at: string
          completed_at: string | null
          status: 'success' | 'failed' | 'partial' | null
          error_message: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          started_at?: string
          completed_at?: string | null
          status?: 'success' | 'failed' | 'partial' | null
          error_message?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          started_at?: string
          completed_at?: string | null
          status?: 'success' | 'failed' | 'partial' | null
          error_message?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
      }
    }
  }
}
