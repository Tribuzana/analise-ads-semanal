export type AlertType =
  | 'low_performance'
  | 'low_budget'
  | 'no_spend'
  | 'ending_soon'
  | 'budget_exhausted'
  | 'impression_drop'
  | 'cpc_spike'
  | 'paused_potential'
  | 'scale_opportunity'
  | 'impression_share_lost'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  campaign_id: string
  campaign_name: string
  client: string
  platform: 'Google Ads' | 'Meta Ads' | 'Google' | 'Meta'
  message: string
  metrics: Record<string, any>
  actions: string[]
  created_at: string
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
}

export interface AlertConfig {
  hotelId: number
  nomeHotel: string
  rules: {
    roasMin: number
    cpaMax: number
    ctrMin: number
  }
  webhookUrl: string | null
  webhookSecret: string | null
  webhookActive: boolean
}

export interface AlertStats {
  total: number
  critical: number
  warning: number
  info: number
}

// Manter compatibilidade com código antigo
export interface Alerta {
  id: string
  hotel_id: number
  hotel_nome: string
  tipo: 'spend_anomaly' | 'conversion_drop' | 'roas_drop' | 'budget_exceeded'
  severidade: 'low' | 'medium' | 'high' | 'critical'
  mensagem: string
  valor_atual: number
  valor_esperado: number | null
  threshold: number
  data_ocorrencia: string
  resolvido: boolean
  data_resolucao: string | null
}

export interface AlertaConfig {
  hotel_id: number
  alerta_ativo: boolean
  alerta_threshold: number
  alerta_periodo_minutos: number
}
