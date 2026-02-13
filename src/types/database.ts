// Supabase Database Types
// Generated based on the schema in the implementation plan

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          age: number | null;
          sex: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          age?: number | null;
          sex?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          age?: number | null;
          sex?: string | null;
          created_at?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dosage: string | null;
          frequency: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          dosage?: string | null;
          frequency?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          dosage?: string | null;
          frequency?: string | null;
          created_at?: string;
        };
      };
      conditions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      allergies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          question_count: number;
          is_summary_mode: boolean;
          has_red_flag: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          question_count?: number;
          is_summary_mode?: boolean;
          has_red_flag?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          question_count?: number;
          is_summary_mode?: boolean;
          has_red_flag?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          reasoning: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          reasoning?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          reasoning?: Json | null;
          created_at?: string;
        };
      };
      action_items: {
        Row: {
          id: string;
          session_id: string;
          task: string;
          why: string | null;
          urgency: 'routine' | 'urgent';
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          task: string;
          why?: string | null;
          urgency?: 'routine' | 'urgent';
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          task?: string;
          why?: string | null;
          urgency?: 'routine' | 'urgent';
          completed?: boolean;
          created_at?: string;
        };
      };
      health_insights: {
        Row: {
          id: string;
          user_id: string;
          source_session_id: string | null;
          category: 'sleep' | 'energy' | 'digestion' | 'pain' | 'mood' | 'other';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_session_id?: string | null;
          category: 'sleep' | 'energy' | 'digestion' | 'pain' | 'mood' | 'other';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_session_id?: string | null;
          category?: 'sleep' | 'energy' | 'digestion' | 'pain' | 'mood' | 'other';
          content?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper types for convenience
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Medication = Database['public']['Tables']['medications']['Row'];
export type Condition = Database['public']['Tables']['conditions']['Row'];
export type Allergy = Database['public']['Tables']['allergies']['Row'];
export type ChatSessionDB = Database['public']['Tables']['chat_sessions']['Row'];
export type MessageDB = Database['public']['Tables']['messages']['Row'];
export type ActionItemDB = Database['public']['Tables']['action_items']['Row'];
export type HealthInsightDB = Database['public']['Tables']['health_insights']['Row'];
