// Hand-authored types mirroring the Supabase schema in supabase/migrations.
// Keep in sync with the SQL. (Can be regenerated via `supabase gen types`.)

export type CertStatus = "pending" | "approved" | "rejected";
export type Visibility = "public" | "private";
export type Difficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "all-levels";
export type AppRole = "instructor" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          specialization: string | null;
          role: AppRole;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          specialization?: string | null;
          role?: AppRole;
          verified?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      certifications: {
        Row: {
          id: string;
          profile_id: string;
          title: string | null;
          file_url: string;
          status: CertStatus;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title?: string | null;
          file_url: string;
          status?: CertStatus;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["certifications"]["Insert"]
        >;
        Relationships: [];
      };
      flows: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          category: string;
          difficulty: Difficulty;
          duration_minutes: number;
          cover_image: string | null;
          youtube_url: string | null;
          visibility: Visibility;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          category: string;
          difficulty: Difficulty;
          duration_minutes: number;
          cover_image?: string | null;
          youtube_url?: string | null;
          visibility?: Visibility;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["flows"]["Insert"]>;
        Relationships: [];
      };
      flow_steps: {
        Row: {
          id: string;
          flow_id: string;
          order_index: number;
          title: string;
          content: string | null;
          duration_minutes: number | null;
        };
        Insert: {
          id?: string;
          flow_id: string;
          order_index: number;
          title: string;
          content?: string | null;
          duration_minutes?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["flow_steps"]["Insert"]>;
        Relationships: [];
      };
      likes: {
        Row: { user_id: string; flow_id: string; created_at: string };
        Insert: { user_id: string; flow_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["likes"]["Insert"]>;
        Relationships: [];
      };
      steals: {
        Row: { user_id: string; flow_id: string; created_at: string };
        Insert: { user_id: string; flow_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["steals"]["Insert"]>;
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["follows"]["Insert"]>;
        Relationships: [];
      };
      ai_generations: {
        Row: {
          id: string;
          user_id: string;
          prompt: string;
          params: Json | null;
          generated_content: Json;
          saved_flow_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt: string;
          params?: Json | null;
          generated_content: Json;
          saved_flow_id?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["ai_generations"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: {
      flow_stats: {
        Row: {
          flow_id: string | null;
          like_count: number | null;
          steal_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Convenience aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Certification =
  Database["public"]["Tables"]["certifications"]["Row"];
export type Flow = Database["public"]["Tables"]["flows"]["Row"];
export type FlowStep = Database["public"]["Tables"]["flow_steps"]["Row"];
export type AiGeneration =
  Database["public"]["Tables"]["ai_generations"]["Row"];

/** A generated flow as produced by the AI layer. */
export interface GeneratedFlow {
  title: string;
  summary: string;
  category: string;
  difficulty: Difficulty;
  duration_minutes: number;
  steps: { title: string; content: string; duration_minutes: number }[];
}
