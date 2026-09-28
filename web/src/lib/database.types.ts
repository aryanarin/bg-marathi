/**
 * Database types.
 *
 * These mirror the schema in supabase/migrations, expressed in the shape the
 * Supabase client expects (`Database['public']['Tables'][T]['Row' | 'Insert' |
 * 'Update']`). They are hand-authored to match the applied migrations rather
 * than generated, because generating requires a Supabase dashboard access token
 * (`supabase login`) that the API keys alone do not provide.
 *
 * If the schema changes, update this file in the same commit as the migration.
 * The single source of truth for the schema is supabase/migrations; this file
 * must agree with it.
 */

type Timestamp = string;
type Uuid = string;

export type UserRole = "user" | "admin";
export type MeetingPlatform = "google_meet" | "zoom" | "other";
export type AudioProvider = "supabase_storage" | "google_drive" | "external";
export type QuizOption = "a" | "b" | "c" | "d";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: Uuid;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: Uuid;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        // A learner can only update full_name and avatar_url (column grants).
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      chapters: {
        Row: {
          id: Uuid;
          chapter_number: number;
          name_sanskrit: string;
          name_marathi: string;
          description: string | null;
          total_verses: number;
          display_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          chapter_number: number;
          name_sanskrit: string;
          name_marathi: string;
          description?: string | null;
          total_verses: number;
          display_order: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["chapters"]["Insert"]>;
      };
      verses: {
        Row: {
          id: Uuid;
          chapter_id: Uuid;
          verse_number: number;
          verse_number_end: number | null;
          sanskrit_text: string;
          word_to_word: string | null;
          translation: string | null;
          purport: string | null;
          easy_explanation: string | null;
          example: string | null;
          audio_url: string | null;
          audio_provider: AudioProvider | null;
          display_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          chapter_id: Uuid;
          verse_number: number;
          verse_number_end?: number | null;
          sanskrit_text: string;
          word_to_word?: string | null;
          translation?: string | null;
          purport?: string | null;
          easy_explanation?: string | null;
          example?: string | null;
          audio_url?: string | null;
          audio_provider?: AudioProvider | null;
          display_order: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["verses"]["Insert"]>;
      };
      verse_progress: {
        Row: {
          id: Uuid;
          user_id: Uuid;
          verse_id: Uuid;
          is_read: boolean;
          is_memorized: boolean;
          read_at: Timestamp | null;
          memorized_at: Timestamp | null;
          total_time_seconds: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          user_id: Uuid;
          verse_id: Uuid;
          is_read?: boolean;
          is_memorized?: boolean;
          read_at?: Timestamp | null;
          memorized_at?: Timestamp | null;
          total_time_seconds?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["verse_progress"]["Insert"]>;
      };
      reading_sessions: {
        Row: {
          id: Uuid;
          user_id: Uuid;
          verse_id: Uuid;
          started_at: Timestamp;
          ended_at: Timestamp;
          duration_seconds: number;
          created_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          user_id: Uuid;
          verse_id: Uuid;
          started_at: Timestamp;
          ended_at: Timestamp;
          duration_seconds: number;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["reading_sessions"]["Insert"]>;
      };
      classes: {
        Row: {
          id: Uuid;
          title: string;
          description: string | null;
          class_date: string;
          class_time: string;
          meeting_platform: MeetingPlatform;
          meeting_url: string;
          is_published: boolean;
          created_by: Uuid | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          title: string;
          description?: string | null;
          class_date: string;
          class_time: string;
          meeting_platform: MeetingPlatform;
          meeting_url: string;
          is_published?: boolean;
          created_by?: Uuid | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
      };
      quizzes: {
        Row: {
          id: Uuid;
          title: string;
          description: string | null;
          chapter_id: Uuid | null;
          verse_start: number | null;
          verse_end: number | null;
          is_published: boolean;
          created_by: Uuid | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          title: string;
          description?: string | null;
          chapter_id?: Uuid | null;
          verse_start?: number | null;
          verse_end?: number | null;
          is_published?: boolean;
          created_by?: Uuid | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Insert"]>;
      };
      quiz_questions: {
        Row: {
          id: Uuid;
          quiz_id: Uuid;
          question: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: QuizOption;
          explanation: string | null;
          display_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: Uuid;
          quiz_id: Uuid;
          question: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: QuizOption;
          explanation?: string | null;
          display_order: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_questions"]["Insert"]>;
      };
      quiz_attempts: {
        Row: {
          id: Uuid;
          quiz_id: Uuid;
          user_id: Uuid;
          score: number;
          total_questions: number;
          started_at: Timestamp;
          completed_at: Timestamp | null;
        };
        Insert: {
          id?: Uuid;
          quiz_id: Uuid;
          user_id: Uuid;
          score?: number;
          total_questions: number;
          started_at?: Timestamp;
          completed_at?: Timestamp | null;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_attempts"]["Insert"]>;
      };
      quiz_answers: {
        Row: {
          id: Uuid;
          attempt_id: Uuid;
          question_id: Uuid;
          selected_option: QuizOption | null;
          is_correct: boolean;
        };
        Insert: {
          id?: Uuid;
          attempt_id: Uuid;
          question_id: Uuid;
          selected_option?: QuizOption | null;
          is_correct?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_answers"]["Insert"]>;
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      record_reading_session: {
        Args: { p_verse_id: Uuid; p_duration: number };
        Returns: undefined;
      };
      set_verse_progress: {
        Args: {
          p_verse_id: Uuid;
          p_is_read?: boolean | null;
          p_is_memorized?: boolean | null;
        };
        Returns: Database["public"]["Tables"]["verse_progress"]["Row"];
      };
      submit_quiz_attempt: {
        Args: { p_attempt_id: Uuid; p_answers: unknown };
        Returns: unknown;
      };
    };
    Enums: Record<never, never>;
  };
}
