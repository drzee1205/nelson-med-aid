export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event: string
          id: number
          user_sub_hash: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event: string
          id?: number
          user_sub_hash: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event?: string
          id?: number
          user_sub_hash?: string
        }
        Relationships: []
      }
      godzilla_medical_dataset: {
        Row: {
          age_groups: string | null
          book_title: string | null
          chapter_title: string | null
          chunk_token_count: number | null
          clinical_relevance_score: number | null
          confidence_score: number | null
          created_at: string | null
          id: string
          keywords: string | null
          learning_objectives: string | null
          medical_specialty: string | null
          page_number: number | null
          reading_difficulty: string | null
          source_dataset: string
          source_file: string | null
          text: string
        }
        Insert: {
          age_groups?: string | null
          book_title?: string | null
          chapter_title?: string | null
          chunk_token_count?: number | null
          clinical_relevance_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id: string
          keywords?: string | null
          learning_objectives?: string | null
          medical_specialty?: string | null
          page_number?: number | null
          reading_difficulty?: string | null
          source_dataset: string
          source_file?: string | null
          text: string
        }
        Update: {
          age_groups?: string | null
          book_title?: string | null
          chapter_title?: string | null
          chunk_token_count?: number | null
          clinical_relevance_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          keywords?: string | null
          learning_objectives?: string | null
          medical_specialty?: string | null
          page_number?: number | null
          reading_difficulty?: string | null
          source_dataset?: string
          source_file?: string | null
          text?: string
        }
        Relationships: []
      }
      medical_chunks: {
        Row: {
          authors: string | null
          book_title: string | null
          chapter_title: string | null
          chunk_index: number | null
          chunk_summary: string | null
          chunk_text: string
          chunk_token_count: number | null
          confidence_score: number | null
          created_at: string | null
          edition: string | null
          embedding: string | null
          id: string
          isbn: string | null
          keywords: string | null
          page_number: number | null
          publisher: string | null
          section_heading_path: string | null
          section_title: string | null
          source_url: string | null
          year: string | null
        }
        Insert: {
          authors?: string | null
          book_title?: string | null
          chapter_title?: string | null
          chunk_index?: number | null
          chunk_summary?: string | null
          chunk_text: string
          chunk_token_count?: number | null
          confidence_score?: number | null
          created_at?: string | null
          edition?: string | null
          embedding?: string | null
          id: string
          isbn?: string | null
          keywords?: string | null
          page_number?: number | null
          publisher?: string | null
          section_heading_path?: string | null
          section_title?: string | null
          source_url?: string | null
          year?: string | null
        }
        Update: {
          authors?: string | null
          book_title?: string | null
          chapter_title?: string | null
          chunk_index?: number | null
          chunk_summary?: string | null
          chunk_text?: string
          chunk_token_count?: number | null
          confidence_score?: number | null
          created_at?: string | null
          edition?: string | null
          embedding?: string | null
          id?: string
          isbn?: string | null
          keywords?: string | null
          page_number?: number | null
          publisher?: string | null
          section_heading_path?: string | null
          section_title?: string | null
          source_url?: string | null
          year?: string | null
        }
        Relationships: []
      }
      medical_chunks_raw: {
        Row: {
          authors: string | null
          book_title: string | null
          chapter_title: string | null
          chunk_index: string | null
          chunk_summary: string | null
          chunk_text: string | null
          chunk_token_count: string | null
          confidence_score: string | null
          created_at: string | null
          drive_link: string | null
          edition: string | null
          id: string | null
          isbn: string | null
          keywords: string | null
          page_number: string | null
          publisher: string | null
          section_heading_path: string | null
          section_title: string | null
          source_url: string | null
          year: string | null
        }
        Insert: {
          authors?: string | null
          book_title?: string | null
          chapter_title?: string | null
          chunk_index?: string | null
          chunk_summary?: string | null
          chunk_text?: string | null
          chunk_token_count?: string | null
          confidence_score?: string | null
          created_at?: string | null
          drive_link?: string | null
          edition?: string | null
          id?: string | null
          isbn?: string | null
          keywords?: string | null
          page_number?: string | null
          publisher?: string | null
          section_heading_path?: string | null
          section_title?: string | null
          source_url?: string | null
          year?: string | null
        }
        Update: {
          authors?: string | null
          book_title?: string | null
          chapter_title?: string | null
          chunk_index?: string | null
          chunk_summary?: string | null
          chunk_text?: string | null
          chunk_token_count?: string | null
          confidence_score?: string | null
          created_at?: string | null
          drive_link?: string | null
          edition?: string | null
          id?: string | null
          isbn?: string | null
          keywords?: string | null
          page_number?: string | null
          publisher?: string | null
          section_heading_path?: string | null
          section_title?: string | null
          source_url?: string | null
          year?: string | null
        }
        Relationships: []
      }
      medical_entities: {
        Row: {
          chunk_id: string | null
          end_offset: number | null
          entity: string
          entity_type: string | null
          id: number
          start_offset: number | null
        }
        Insert: {
          chunk_id?: string | null
          end_offset?: number | null
          entity: string
          entity_type?: string | null
          id?: number
          start_offset?: number | null
        }
        Update: {
          chunk_id?: string | null
          end_offset?: number | null
          entity?: string
          entity_type?: string | null
          id?: number
          start_offset?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_entities_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "medical_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      queries: {
        Row: {
          answer: string | null
          citations: string[] | null
          confidence: number | null
          created_at: string | null
          id: number
          latency_ms: number | null
          meta: Json | null
          model: string | null
          session_id: string | null
          token_count: number | null
          user_question: string
        }
        Insert: {
          answer?: string | null
          citations?: string[] | null
          confidence?: number | null
          created_at?: string | null
          id?: number
          latency_ms?: number | null
          meta?: Json | null
          model?: string | null
          session_id?: string | null
          token_count?: number | null
          user_question: string
        }
        Update: {
          answer?: string | null
          citations?: string[] | null
          confidence?: number | null
          created_at?: string | null
          id?: number
          latency_ms?: number | null
          meta?: Json | null
          model?: string | null
          session_id?: string | null
          token_count?: number | null
          user_question?: string
        }
        Relationships: [
          {
            foreignKeyName: "queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          ended_at: string | null
          id: string
          meta: Json | null
          started_at: string | null
          user_sub: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          meta?: Json | null
          started_at?: string | null
          user_sub: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          meta?: Json | null
          started_at?: string | null
          user_sub?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_medical_chunks: {
        Args: {
          keywords?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          book_title: string
          chapter_title: string
          chunk_text: string
          id: string
          page_number: number
          section_title: string
          similarity: number
          source_url: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
