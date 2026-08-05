// =============================================================================
// Tipos do banco — GERADOS automaticamente a partir do schema Supabase.
// NÃO editar à mão. Regenerar após mudar migrations:
//   npx supabase gen types typescript --project-id <ref> --schema public > src/lib/supabase/types.ts
// =============================================================================

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          ativo: boolean
          banco: string | null
          created_at: string
          id: string
          moeda: string
          nome: string
          pluggy_account_id: string | null
          pluggy_item_id: string | null
          saldo: number | null
          tipo: string
          ultimo_sync: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          banco?: string | null
          created_at?: string
          id?: string
          moeda?: string
          nome: string
          pluggy_account_id?: string | null
          pluggy_item_id?: string | null
          saldo?: number | null
          tipo: string
          ultimo_sync?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          banco?: string | null
          created_at?: string
          id?: string
          moeda?: string
          nome?: string
          pluggy_account_id?: string | null
          pluggy_item_id?: string | null
          saldo?: number | null
          tipo?: string
          ultimo_sync?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          agendado_para: string | null
          canal: string
          created_at: string
          enviado_em: string | null
          id: string
          lido_em: string | null
          mensagem: string | null
          metadata: Json | null
          tipo: string
          user_id: string
        }
        Insert: {
          agendado_para?: string | null
          canal?: string
          created_at?: string
          enviado_em?: string | null
          id?: string
          lido_em?: string | null
          mensagem?: string | null
          metadata?: Json | null
          tipo: string
          user_id: string
        }
        Update: {
          agendado_para?: string | null
          canal?: string
          created_at?: string
          enviado_em?: string | null
          id?: string
          lido_em?: string | null
          mensagem?: string | null
          metadata?: Json | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          limite: number
          mes_referencia: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          limite: number
          mes_referencia: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          limite?: number
          mes_referencia?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          account_id: string | null
          ativo: boolean
          bandeira: string | null
          created_at: string
          dia_fechamento: number | null
          dia_vencimento: number | null
          id: string
          limite: number | null
          nome: string
          pluggy_card_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          ativo?: boolean
          bandeira?: string | null
          created_at?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          id?: string
          limite?: number | null
          nome: string
          pluggy_card_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          ativo?: boolean
          bandeira?: string | null
          created_at?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          id?: string
          limite?: number | null
          nome?: string
          pluggy_card_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          regras: Json | null
          tipo: string
          user_id: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          regras?: Json | null
          tipo?: string
          user_id?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          regras?: Json | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          concluida: boolean
          created_at: string
          data_alvo: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data_alvo?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
          valor_alvo: number
          valor_atual?: number
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data_alvo?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: []
      }
      installments: {
        Row: {
          card_id: string | null
          created_at: string
          descricao: string
          id: string
          parcela_atual: number
          primeira_parcela: string
          total_parcelas: number
          transaction_id: string | null
          user_id: string
          valor_parcela: number
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          parcela_atual: number
          primeira_parcela: string
          total_parcelas: number
          transaction_id?: string | null
          user_id: string
          valor_parcela: number
        }
        Update: {
          card_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          parcela_atual?: number
          primeira_parcela?: string
          total_parcelas?: number
          transaction_id?: string | null
          user_id?: string
          valor_parcela?: number
        }
        Relationships: [
          {
            foreignKeyName: "installments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          account_id: string | null
          created_at: string
          data_aplicacao: string | null
          data_vencimento: string | null
          id: string
          nome: string
          pluggy_inv_id: string | null
          rendimento_pct: number | null
          tipo: string
          ultimo_sync: string | null
          updated_at: string
          user_id: string
          valor_aplicado: number | null
          valor_atual: number | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          data_aplicacao?: string | null
          data_vencimento?: string | null
          id?: string
          nome: string
          pluggy_inv_id?: string | null
          rendimento_pct?: number | null
          tipo: string
          ultimo_sync?: string | null
          updated_at?: string
          user_id: string
          valor_aplicado?: number | null
          valor_atual?: number | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          data_aplicacao?: string | null
          data_vencimento?: string | null
          id?: string
          nome?: string
          pluggy_inv_id?: string | null
          rendimento_pct?: number | null
          tipo?: string
          ultimo_sync?: string | null
          updated_at?: string
          user_id?: string
          valor_aplicado?: number | null
          valor_atual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          lgpd_consent_at: string | null
          nome: string | null
          onboarding_done_at: string | null
          plano: string
          telefone: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          lgpd_consent_at?: string | null
          nome?: string | null
          onboarding_done_at?: string | null
          plano?: string
          telefone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          lgpd_consent_at?: string | null
          nome?: string | null
          onboarding_done_at?: string | null
          plano?: string
          telefone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelado_em: string | null
          created_at: string
          id: string
          mp_payer_id: string | null
          mp_subscription_id: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          plano: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelado_em?: string | null
          created_at?: string
          id?: string
          mp_payer_id?: string | null
          mp_subscription_id?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          plano?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelado_em?: string | null
          created_at?: string
          id?: string
          mp_payer_id?: string | null
          mp_subscription_id?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          plano?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          category_id: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          notas: string | null
          origem: string
          pluggy_tx_id: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          account_id: string
          category_id?: string | null
          created_at?: string
          data: string
          descricao: string
          id?: string
          notas?: string | null
          origem?: string
          pluggy_tx_id?: string | null
          tipo?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          account_id?: string
          category_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          notas?: string | null
          origem?: string
          pluggy_tx_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          price_shown: string | null
          source: string | null
          user_agent: string | null
          wants_founder: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          price_shown?: string | null
          source?: string | null
          user_agent?: string | null
          wants_founder?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          price_shown?: string | null
          source?: string | null
          user_agent?: string | null
          wants_founder?: boolean
        }
        Relationships: []
      }
      whatsapp_links: {
        Row: {
          codigo_expira_em: string | null
          codigo_pareamento: string | null
          created_at: string
          id: string
          paired_at: string | null
          status: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo_expira_em?: string | null
          codigo_pareamento?: string | null
          created_at?: string
          id?: string
          paired_at?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo_expira_em?: string | null
          codigo_pareamento?: string | null
          created_at?: string
          id?: string
          paired_at?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
