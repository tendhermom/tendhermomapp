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
      baby_shower_posts: {
        Row: {
          baby_name: string
          birth_date: string | null
          created_at: string
          gender: string
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
          id?: string
          image_url?: string | null
          month_label?: string
          parent_names?: string
          reactions_count?: number
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          status: string
          time_slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          status?: string
          time_slot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          status?: string
          time_slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          channel: string
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
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
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          available: boolean
          consultation_fee: number | null
          created_at: string
          experience_years: number | null
          hospital: string | null
          id: string
          image_url: string | null
          name: string
          rating: number | null
          specialty: string
        }
        Insert: {
          available?: boolean
          consultation_fee?: number | null
          created_at?: string
          experience_years?: number | null
          hospital?: string | null
          id?: string
          image_url?: string | null
          name: string
          rating?: number | null
          specialty: string
        }
        Update: {
          available?: boolean
          consultation_fee?: number | null
          created_at?: string
          experience_years?: number | null
          hospital?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rating?: number | null
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
      health_content: {
        Row: {
          body: string
          category: string
          created_at: string
          icon: string | null
          id: string
          published: boolean
          title: string
          trimester: Database["public"]["Enums"]["pregnancy_stage"] | null
          week_number: number | null
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          published?: boolean
          title: string
          trimester?: Database["public"]["Enums"]["pregnancy_stage"] | null
          week_number?: number | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          published?: boolean
          title?: string
          trimester?: Database["public"]["Enums"]["pregnancy_stage"] | null
          week_number?: number | null
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
      reminders: {
        Row: {
          created_at: string
          done: boolean
          id: string
          reminder_date: string
          time: string
          title: string
          type: Database["public"]["Enums"]["reminder_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          reminder_date?: string
          time?: string
          title: string
          type?: Database["public"]["Enums"]["reminder_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          reminder_date?: string
          time?: string
          title?: string
          type?: Database["public"]["Enums"]["reminder_type"]
          updated_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
    },
  },
} as const
