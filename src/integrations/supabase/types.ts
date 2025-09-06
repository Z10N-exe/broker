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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      balances: {
        Row: {
          balance: number
          currency: string
          daily_profit_loss: number | null
          id: string
          last_update_date: string | null
          locked_balance: number
          profit_loss_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency: string
          daily_profit_loss?: number | null
          id?: string
          last_update_date?: string | null
          locked_balance?: number
          profit_loss_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          daily_profit_loss?: number | null
          id?: string
          last_update_date?: string | null
          locked_balance?: number
          profit_loss_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_prices: {
        Row: {
          current_price: number
          id: string
          last_updated: string
          market_cap: number | null
          name: string
          price_change_24h: number | null
          price_change_percentage_24h: number | null
          symbol: string
          volume_24h: number | null
        }
        Insert: {
          current_price: number
          id?: string
          last_updated?: string
          market_cap?: number | null
          name: string
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          symbol: string
          volume_24h?: number | null
        }
        Update: {
          current_price?: number
          id?: string
          last_updated?: string
          market_cap?: number | null
          name?: string
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          symbol?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          confirmed_at: string | null
          created_at: string
          currency: string
          deposit_address: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string | null
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          deposit_address?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          deposit_address?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bonus_claimed: boolean | null
          created_at: string
          date_of_birth: string | null
          email_verified: boolean | null
          full_name: string
          id: string
          id_document_url: string | null
          kyc_notes: string | null
          kyc_reviewed_at: string | null
          kyc_status: string | null
          kyc_submitted_at: string | null
          location: string | null
          nickname: string | null
          phone_number: string | null
          referral_bonus_claimed: number | null
          referral_code: string | null
          referred_by: string | null
          selfie_document_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_claimed?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          email_verified?: boolean | null
          full_name: string
          id?: string
          id_document_url?: string | null
          kyc_notes?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          location?: string | null
          nickname?: string | null
          phone_number?: string | null
          referral_bonus_claimed?: number | null
          referral_code?: string | null
          referred_by?: string | null
          selfie_document_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_claimed?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          email_verified?: boolean | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          kyc_notes?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          location?: string | null
          nickname?: string | null
          phone_number?: string | null
          referral_bonus_claimed?: number | null
          referral_code?: string | null
          referred_by?: string | null
          selfie_document_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          created_at: string
          executed_at: string | null
          id: string
          order_type: string
          price: number
          side: string
          status: string
          total: number
          trade_type: string
          trading_pair: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          executed_at?: string | null
          id?: string
          order_type: string
          price: number
          side: string
          status?: string
          total: number
          trade_type: string
          trading_pair: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          executed_at?: string | null
          id?: string
          order_type?: string
          price?: number
          side?: string
          status?: string
          total?: number
          trade_type?: string
          trading_pair?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          encrypted_data: string
          id: string
          updated_at: string
          user_id: string
          wallet_name: string
          wallet_type: string
        }
        Insert: {
          created_at?: string
          encrypted_data: string
          id?: string
          updated_at?: string
          user_id: string
          wallet_name: string
          wallet_type: string
        }
        Update: {
          created_at?: string
          encrypted_data?: string
          id?: string
          updated_at?: string
          user_id?: string
          wallet_name?: string
          wallet_type?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          processed_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          withdrawal_address: string | null
          withdrawal_method: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string
          id?: string
          processed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          withdrawal_address?: string | null
          withdrawal_method?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          processed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          withdrawal_address?: string | null
          withdrawal_method?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_balance_growth: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_daily_profit_loss: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
