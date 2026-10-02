/**
 * Database types — GENERATED from the live schema.
 *
 * Regenerate after any migration (see scripts/ in prior runs):
 *   supabase gen types typescript --db-url $SUPABASE_DB_URL --schema public
 * Do not hand-edit. Semantic enum unions live in lib/types.ts.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      chapters: {
        Row: {
          chapter_number: number;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          is_published: boolean;
          name_marathi: string;
          name_sanskrit: string;
          total_verses: number;
          updated_at: string;
        };
        Insert: {
          chapter_number: number;
          created_at?: string;
          description?: string | null;
          display_order: number;
          id?: string;
          is_published?: boolean;
          name_marathi: string;
          name_sanskrit: string;
          total_verses: number;
          updated_at?: string;
        };
        Update: {
          chapter_number?: number;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_published?: boolean;
          name_marathi?: string;
          name_sanskrit?: string;
          total_verses?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          class_date: string;
          class_time: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_published: boolean;
          meeting_platform: string;
          meeting_url: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          class_date: string;
          class_time: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          meeting_platform: string;
          meeting_url: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          class_date?: string;
          class_time?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          meeting_platform?: string;
          meeting_url?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_answers: {
        Row: {
          attempt_id: string;
          id: string;
          is_correct: boolean;
          question_id: string;
          selected_option: string | null;
        };
        Insert: {
          attempt_id: string;
          id?: string;
          is_correct?: boolean;
          question_id: string;
          selected_option?: string | null;
        };
        Update: {
          attempt_id?: string;
          id?: string;
          is_correct?: boolean;
          question_id?: string;
          selected_option?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "quiz_attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "quiz_questions";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          completed_at: string | null;
          id: string;
          quiz_id: string;
          score: number;
          started_at: string;
          total_questions: number;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          id?: string;
          quiz_id: string;
          score?: number;
          started_at?: string;
          total_questions: number;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          id?: string;
          quiz_id?: string;
          score?: number;
          started_at?: string;
          total_questions?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          correct_option: string;
          created_at: string;
          display_order: number;
          explanation: string | null;
          id: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          question: string;
          quiz_id: string;
          updated_at: string;
        };
        Insert: {
          correct_option: string;
          created_at?: string;
          display_order: number;
          explanation?: string | null;
          id?: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          question: string;
          quiz_id: string;
          updated_at?: string;
        };
        Update: {
          correct_option?: string;
          created_at?: string;
          display_order?: number;
          explanation?: string | null;
          id?: string;
          option_a?: string;
          option_b?: string;
          option_c?: string;
          option_d?: string;
          question?: string;
          quiz_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      quizzes: {
        Row: {
          chapter_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_published: boolean;
          title: string;
          updated_at: string;
          verse_end: number | null;
          verse_start: number | null;
        };
        Insert: {
          chapter_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          title: string;
          updated_at?: string;
          verse_end?: number | null;
          verse_start?: number | null;
        };
        Update: {
          chapter_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          title?: string;
          updated_at?: string;
          verse_end?: number | null;
          verse_start?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quizzes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_sessions: {
        Row: {
          created_at: string;
          duration_seconds: number;
          ended_at: string;
          id: string;
          started_at: string;
          user_id: string;
          verse_id: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds: number;
          ended_at: string;
          id?: string;
          started_at: string;
          user_id: string;
          verse_id: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number;
          ended_at?: string;
          id?: string;
          started_at?: string;
          user_id?: string;
          verse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_sessions_verse_id_fkey";
            columns: ["verse_id"];
            isOneToOne: false;
            referencedRelation: "verses";
            referencedColumns: ["id"];
          },
        ];
      };
      schema_migrations: {
        Row: {
          applied_at: string;
          filename: string;
        };
        Insert: {
          applied_at?: string;
          filename: string;
        };
        Update: {
          applied_at?: string;
          filename?: string;
        };
        Relationships: [];
      };
      verse_progress: {
        Row: {
          created_at: string;
          id: string;
          is_memorized: boolean;
          is_read: boolean;
          memorized_at: string | null;
          read_at: string | null;
          total_time_seconds: number;
          updated_at: string;
          user_id: string;
          verse_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_memorized?: boolean;
          is_read?: boolean;
          memorized_at?: string | null;
          read_at?: string | null;
          total_time_seconds?: number;
          updated_at?: string;
          user_id: string;
          verse_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_memorized?: boolean;
          is_read?: boolean;
          memorized_at?: string | null;
          read_at?: string | null;
          total_time_seconds?: number;
          updated_at?: string;
          user_id?: string;
          verse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verse_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "verse_progress_verse_id_fkey";
            columns: ["verse_id"];
            isOneToOne: false;
            referencedRelation: "verses";
            referencedColumns: ["id"];
          },
        ];
      };
      verses: {
        Row: {
          audio_provider: string | null;
          audio_url: string | null;
          chapter_id: string;
          created_at: string;
          display_order: number;
          easy_explanation: string | null;
          example: string | null;
          id: string;
          purport: string | null;
          sanskrit_text: string;
          translation: string | null;
          updated_at: string;
          verse_number: number;
          verse_number_end: number | null;
          word_to_word: string | null;
        };
        Insert: {
          audio_provider?: string | null;
          audio_url?: string | null;
          chapter_id: string;
          created_at?: string;
          display_order: number;
          easy_explanation?: string | null;
          example?: string | null;
          id?: string;
          purport?: string | null;
          sanskrit_text: string;
          translation?: string | null;
          updated_at?: string;
          verse_number: number;
          verse_number_end?: number | null;
          word_to_word?: string | null;
        };
        Update: {
          audio_provider?: string | null;
          audio_url?: string | null;
          chapter_id?: string;
          created_at?: string;
          display_order?: number;
          easy_explanation?: string | null;
          example?: string | null;
          id?: string;
          purport?: string | null;
          sanskrit_text?: string;
          translation?: string | null;
          updated_at?: string;
          verse_number?: number;
          verse_number_end?: number | null;
          word_to_word?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "verses_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      record_reading_session: {
        Args: { p_duration: number; p_verse_id: string };
        Returns: undefined;
      };
      set_verse_progress: {
        Args: { p_is_memorized?: boolean; p_is_read?: boolean; p_verse_id: string };
        Returns: {
          created_at: string;
          id: string;
          is_memorized: boolean;
          is_read: boolean;
          memorized_at: string | null;
          read_at: string | null;
          total_time_seconds: number;
          updated_at: string;
          user_id: string;
          verse_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "verse_progress";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      submit_quiz_attempt: { Args: { p_answers: Json; p_attempt_id: string }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
