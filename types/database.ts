export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nome_completo: string
          nivel_acesso: 'admin' | 'analista' | 'gerente' | 'usuario'
          ativo: boolean
          avatar_url: string | null
          telefone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
      }
      hoteis_config: {
        Row: {
          id: number
          nome_hotel: string
          nome_fantasia: string | null
          cidade: string | null
          estado: string | null
          motor_reserva: string
          motor_id: string
          cliente_nome: string | null
          cliente_email: string | null
          cliente_telefone: string | null
          ativo: boolean
          gtm_container_id: string | null
          alerta_ativo: boolean
          alerta_threshold: number
          alerta_periodo_minutos: number
          created_at: string
          updated_at: string
          dominio_motor: string | null
        }
        Insert: Omit<Database['public']['Tables']['hoteis_config']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['hoteis_config']['Insert']>
      }
      metricas_ads: {
        Row: {
          date: string
          client: string
          platform: 'Google' | 'Meta' | 'Google Ads' | 'Meta Ads'
          account_name: string | null
          account_id: string
          campaign_name: string | null
          campaign_id: string
          impressions: number | null
          clicks: number | null
          spend: number | null
          ctr: number | null
          action_value_omni_purchase: number | null
          action_omni_purchase: number | null
          estimated_reach: number | null
          frequency: number | null
          action_link_clicks: number | null
          action_leads: number | null
          action_messaging_conversations_started_onsite_conversion: number | null
          action_omni_add_to_cart: number | null
          action_omni_initiated_checkout: number | null
          account_level_spend_cap: number | null
          account_level_amount_spent: number | null
          average_cpc: number | null
          conversions: number | null
          conversions_value: number | null
          conversions_from_interactions_rate: number | null
          search_impression_share: number | null
          advertising_channel_type: string | null
          campaign_bidding_strategy_type: string | null
          cost_per_conversion: number | null
          search_rank_lost_impression_share: number | null
          search_top_impression_share: number | null
          search_rank_lost_top_impression_share: number | null
          search_budget_lost_impression_share: number | null
          campaign_budget_recommended_budget_amount: number | null
          campaign_status: string | null
          serving_status: string | null
          view_through_conversions: number | null
          content_impression_share: number | null
          all_conversions_from_interactions_rate: number | null
          search_absolute_top_impression_share: number | null
          campaign_objective: string | null
          account_status: string | null
          min_daily_budget: number | null
        }
        Insert: Database['public']['Tables']['metricas_ads']['Row']
        Update: Partial<Database['public']['Tables']['metricas_ads']['Row']>
      }
    }
    Functions: {
      get_balance_alerts: {
        Args: {
          p_user_id: string | null
          p_user_role: string | null
        }
        Returns: any[]
      }
      get_google_ads_budget_alerts: {
        Args: {
          p_user_id: string | null
          p_user_role: string | null
        }
        Returns: any[]
      }
    }
  }
}
