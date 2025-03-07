export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          created_at: string | null
          current_question_index: number | null
          ended_at: string | null
          host_id: string
          id: string
          quiz_id: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_question_index?: number | null
          ended_at?: string | null
          host_id: string
          id?: string
          quiz_id: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_question_index?: number | null
          ended_at?: string | null
          host_id?: string
          id?: string
          quiz_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      player_sessions: {
        Row: {
          answers: Json | null
          created_at: string | null
          game_session_id: string
          id: string
          player_id: string | null
          player_name: string
          score: number | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          game_session_id: string
          id?: string
          player_id?: string | null
          player_name: string
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          game_session_id?: string
          id?: string
          player_id?: string | null
          player_name?: string
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_sessions_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_sessions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_teacher: boolean | null
          last_name: string | null
          updated_at: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          is_teacher?: boolean | null
          last_name?: string | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_teacher?: boolean | null
          last_name?: string | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          id: string
          options: Json | null
          order_num: number | null
          points: number | null
          question_text: string
          question_type: string
          quiz_id: string
          time_limit: number | null
          updated_at: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          options?: Json | null
          order_num?: number | null
          points?: number | null
          question_text: string
          question_type: string
          quiz_id: string
          time_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          options?: Json | null
          order_num?: number | null
          points?: number | null
          question_text?: string
          question_type?: string
          quiz_id?: string
          time_limit?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          game_pin: string | null
          id: string
          is_public: boolean | null
          shuffle_questions: boolean | null
          time_limit: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          game_pin?: string | null
          id?: string
          is_public?: boolean | null
          shuffle_questions?: boolean | null
          time_limit?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          game_pin?: string | null
          id?: string
          is_public?: boolean | null
          shuffle_questions?: boolean | null
          time_limit?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_player_session: {
        Args: {
          p_game_session_id: string
          p_player_name: string
          p_player_id?: string
        }
        Returns: {
          answers: Json | null
          created_at: string | null
          game_session_id: string
          id: string
          player_id: string | null
          player_name: string
          score: number | null
          updated_at: string | null
        }
      }
      generate_unique_game_pin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_sessions_for_quiz: {
        Args: {
          p_quiz_id: string
        }
        Returns: {
          created_at: string | null
          current_question_index: number | null
          ended_at: string | null
          host_id: string
          id: string
          quiz_id: string
          started_at: string | null
          status: string
          updated_at: string | null
        }[]
      }
      get_auth_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_game_session_details: {
        Args: {
          session_id: string
        }
        Returns: {
          created_at: string | null
          current_question_index: number | null
          ended_at: string | null
          host_id: string
          id: string
          quiz_id: string
          started_at: string | null
          status: string
          updated_at: string | null
        }[]
      }
      get_player_sessions_for_game: {
        Args: {
          p_game_session_id: string
        }
        Returns: {
          answers: Json | null
          created_at: string | null
          game_session_id: string
          id: string
          player_id: string | null
          player_name: string
          score: number | null
          updated_at: string | null
        }[]
      }
      get_quiz_question_count: {
        Args: {
          quiz_id: string
        }
        Returns: number
      }
      get_quiz_questions: {
        Args: {
          quiz_id: string
        }
        Returns: {
          correct_answer: string | null
          created_at: string | null
          id: string
          options: Json | null
          order_num: number | null
          points: number | null
          question_text: string
          question_type: string
          quiz_id: string
          time_limit: number | null
          updated_at: string | null
        }[]
      }
      get_quiz_session_count: {
        Args: {
          quiz_id: string
        }
        Returns: number
      }
      user_is_game_host: {
        Args: {
          session_id: string
        }
        Returns: boolean
      }
      user_is_in_session: {
        Args: {
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      user_is_quiz_creator: {
        Args: {
          quiz_id: string
        }
        Returns: boolean
      }
      user_is_session_player: {
        Args: {
          session_id: string
        }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
