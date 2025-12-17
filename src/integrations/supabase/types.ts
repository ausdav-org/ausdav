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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_enabled: boolean
          permission_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_enabled?: boolean
          permission_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_enabled?: boolean
          permission_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          cta_label: string | null
          end_at: string | null
          id: string
          is_active: boolean
          link_url: string | null
          message_en: string | null
          message_ta: string | null
          priority: number
          start_at: string | null
          tag: string | null
          title_en: string
          title_ta: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          message_en?: string | null
          message_ta?: string | null
          priority?: number
          start_at?: string | null
          tag?: string | null
          title_en: string
          title_ta?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          message_en?: string | null
          message_ta?: string | null
          priority?: number
          start_at?: string | null
          tag?: string | null
          title_en?: string
          title_ta?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description_en: string | null
          description_ta: string | null
          event_date: string
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          title_en: string
          title_ta: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_ta?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          title_en: string
          title_ta?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_ta?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          title_en?: string
          title_ta?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finance_submissions: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          payer_payee: string | null
          receipt_path: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_by: string | null
          txn_date: string
          txn_type: Database["public"]["Enums"]["txn_type"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          payer_payee?: string | null
          receipt_path?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string | null
          txn_date: string
          txn_type: Database["public"]["Enums"]["txn_type"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          payer_payee?: string | null
          receipt_path?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string | null
          txn_date?: string
          txn_type?: Database["public"]["Enums"]["txn_type"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          payer_payee: string | null
          receipt_path: string | null
          source_submission_id: string | null
          txn_date: string
          txn_type: Database["public"]["Enums"]["txn_type"]
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payer_payee?: string | null
          receipt_path?: string | null
          source_submission_id?: string | null
          txn_date: string
          txn_type: Database["public"]["Enums"]["txn_type"]
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payer_payee?: string | null
          receipt_path?: string | null
          source_submission_id?: string | null
          txn_date?: string
          txn_type?: Database["public"]["Enums"]["txn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "finance_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch: string | null
          can_submit_finance: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          mfa_enabled: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          batch?: string | null
          can_submit_finance?: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          mfa_enabled?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          batch?: string | null
          can_submit_finance?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          mfa_enabled?: boolean
          phone?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_super: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_type: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "member" | "honourable" | "admin" | "super_admin"
      submission_status: "pending" | "approved" | "rejected"
      txn_type: "income" | "expense"
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
      app_role: ["member", "honourable", "admin", "super_admin"],
      submission_status: ["pending", "approved", "rejected"],
      txn_type: ["income", "expense"],
    },
  },
} as const
