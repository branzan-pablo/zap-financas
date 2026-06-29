/**
 * Supabase database type definitions.
 * TODO: replace with auto-generated types via `supabase gen types typescript`
 * once the schema is applied to a linked project.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          telefone: string | null;
          avatar_url: string | null;
          plano: string;
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nome?: string | null;
          telefone?: string | null;
          avatar_url?: string | null;
          plano?: string;
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nome?: string | null;
          telefone?: string | null;
          avatar_url?: string | null;
          plano?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          banco: string | null;
          tipo: string;
          saldo: number | null;
          moeda: string;
          pluggy_item_id: string | null;
          pluggy_account_id: string | null;
          ativo: boolean;
          ultimo_sync: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["accounts"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["accounts"]["Row"], "id" | "user_id" | "created_at">>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          valor: number;
          descricao: string;
          data: string;
          tipo: string;
          pluggy_tx_id: string | null;
          origem: string;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "user_id" | "created_at">>;
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          nome: string;
          icone: string | null;
          cor: string | null;
          tipo: string;
          regras: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at">>;
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          nome: string;
          bandeira: string | null;
          limite: number | null;
          dia_fechamento: number | null;
          dia_vencimento: number | null;
          ativo: boolean;
          pluggy_card_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cards"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["cards"]["Row"], "id" | "user_id" | "created_at">>;
      };
      installments: {
        Row: {
          id: string;
          user_id: string;
          card_id: string | null;
          transaction_id: string | null;
          descricao: string;
          valor_parcela: number;
          total_parcelas: number;
          parcela_atual: number;
          primeira_parcela: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["installments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["installments"]["Row"], "id" | "user_id" | "created_at">>;
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          limite: number;
          mes_referencia: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["budgets"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["budgets"]["Row"], "id" | "user_id" | "created_at">>;
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          descricao: string | null;
          valor_alvo: number;
          valor_atual: number;
          data_alvo: string | null;
          concluida: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["goals"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["goals"]["Row"], "id" | "user_id" | "created_at">>;
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          nome: string;
          tipo: string;
          valor_aplicado: number | null;
          valor_atual: number | null;
          rendimento_pct: number | null;
          data_aplicacao: string | null;
          data_vencimento: string | null;
          pluggy_inv_id: string | null;
          ultimo_sync: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["investments"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["investments"]["Row"], "id" | "user_id" | "created_at">>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plano: string;
          status: string;
          mp_subscription_id: string | null;
          mp_payer_id: string | null;
          periodo_inicio: string | null;
          periodo_fim: string | null;
          trial_ends_at: string | null;
          cancelado_em: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "user_id" | "created_at">>;
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          tipo: string;
          canal: string;
          mensagem: string | null;
          agendado_para: string | null;
          enviado_em: string | null;
          lido_em: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alerts"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["alerts"]["Row"], "id" | "user_id" | "created_at">>;
      };
      whatsapp_links: {
        Row: {
          id: string;
          user_id: string;
          telefone: string;
          status: string;
          codigo_pareamento: string | null;
          codigo_expira_em: string | null;
          paired_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["whatsapp_links"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["whatsapp_links"]["Row"], "id" | "user_id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
