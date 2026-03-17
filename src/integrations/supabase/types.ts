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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          slot_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          slot_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          slot_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "doctor_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      baby_shower_gifts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          message: string | null
          post_id: string
          sender_email: string | null
          sender_name: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          post_id: string
          sender_email?: string | null
          sender_name: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          post_id?: string
          sender_email?: string | null
          sender_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "baby_shower_gifts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "baby_shower_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      baby_shower_posts: {
        Row: {
          baby_name: string
          birth_date: string | null
          created_at: string
          gender: string
          gift_enabled: boolean
          gift_total: number
          id: string
          image_url: string | null
          month_label: string
          parent_names: string
          reactions_count: number
          user_id: string
        }
        Insert: {
          baby_name: string
          birth_date?: string | null
          created_at?: string
          gender: string
          gift_enabled?: boolean
          gift_total?: number
          id?: string
          image_url?: string | null
          month_label: string
          parent_names: string
          reactions_count?: number
          user_id: string
        }
        Update: {
          baby_name?: string
          birth_date?: string | null
          created_at?: string
          gender?: string
          gift_enabled?: boolean
          gift_total?: number
          id?: string
          image_url?: string | null
          month_label?: string
          parent_names?: string
          reactions_count?: number
          user_id?: string
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_memberships: {
        Row: {
          community: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_points: {
        Row: {
          comments_count: number
          created_at: string
          id: string
          likes_count: number
          points: number
          posts_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          points?: number
          posts_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          points?: number
          posts_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          channel: string
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_hidden: boolean
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_slots: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          is_booked: boolean
          slot_date: string
          slot_time: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          is_booked?: boolean
          slot_date: string
          slot_time: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          is_booked?: boolean
          slot_date?: string
          slot_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          specialty: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          specialty: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          specialty?: string
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          channel_success: Json | null
          contacts_notified: number
          created_at: string
          id: string
          is_test: boolean
          latitude: number | null
          longitude: number | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          channel_success?: Json | null
          contacts_notified?: number
          created_at?: string
          id?: string
          is_test?: boolean
          latitude?: number | null
          longitude?: number | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          channel_success?: Json | null
          contacts_notified?: number
          created_at?: string
          id?: string
          is_test?: boolean
          latitude?: number | null
          longitude?: number | null
          triggered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          email_enabled: boolean
          id: string
          is_primary: boolean
          name: string
          phone: string
          relationship: string | null
          sms_enabled: boolean
          user_id: string
          whatsapp_enabled: boolean
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_enabled?: boolean
          id?: string
          is_primary?: boolean
          name: string
          phone: string
          relationship?: string | null
          sms_enabled?: boolean
          user_id: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          email_enabled?: boolean
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string
          relationship?: string | null
          sms_enabled?: boolean
          user_id?: string
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          created_at: string
          diastolic: number | null
          heart_rate: number | null
          id: string
          notes: string | null
          recorded_at: string
          systolic: number | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          diastolic?: number | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          systolic?: number | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          diastolic?: number | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          systolic?: number | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          baby_name: string | null
          birth_date: string | null
          can_post: boolean
          created_at: string
          current_stage: Database["public"]["Enums"]["pregnancy_stage"]
          due_date: string | null
          email: string | null
          full_name: string
          id: string
          lmp_date: string | null
          phone: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          baby_name?: string | null
          birth_date?: string | null
          can_post?: boolean
          created_at?: string
          current_stage?: Database["public"]["Enums"]["pregnancy_stage"]
          due_date?: string | null
          email?: string | null
          full_name?: string
          id: string
          lmp_date?: string | null
          phone?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          baby_name?: string | null
          birth_date?: string | null
          can_post?: boolean
          created_at?: string
          current_stage?: Database["public"]["Enums"]["pregnancy_stage"]
          due_date?: string | null
          email?: string | null
          full_name?: string
          id?: string
          lmp_date?: string | null
          phone?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "baby_shower_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_email: string
          referred_id: string | null
          referrer_id: string
          reward_claimed: boolean
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_email: string
          referred_id?: string | null
          referrer_id: string
          reward_claimed?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_email?: string
          referred_id?: string | null
          referrer_id?: string
          reward_claimed?: boolean
          status?: string
        }
        Relationships: []
      }
      reported_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reported_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      triage_sessions: {
        Row: {
          answers: Json
          created_at: string
          id: string
          outcome: string
          pathway: string
          recommendation: string
          severity: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          outcome: string
          pathway: string
          recommendation: string
          severity: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          outcome?: string
          pathway?: string
          recommendation?: string
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_community_points: {
        Args: { _field: string; _points_to_add: number; _user_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          _action: string
          _max_requests: number
          _user_id: string
          _window_minutes: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      decrement_likes: { Args: { p_post_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_comments: { Args: { p_post_id: string }; Returns: undefined }
      increment_likes: { Args: { p_post_id: string }; Returns: undefined }
      is_user_banned: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      plan_type: "free" | "premium"
      pregnancy_stage:
        | "first_trimester"
        | "second_trimester"
        | "third_trimester"
        | "postpartum"
      reaction_type: "congrats" | "love" | "like" | "celebrate"
      reminder_type: "medication" | "appointment" | "hydration"
      user_type: "mother" | "expert"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      plan_type: ["free", "premium"],
      pregnancy_stage: [
        "first_trimester",
        "second_trimester",
        "third_trimester",
        "postpartum",
      ],
      reaction_type: ["congrats", "love", "like", "celebrate"],
      reminder_type: ["medication", "appointment", "hydration"],
      user_type: ["mother", "expert"],
    },
  },
} as const
