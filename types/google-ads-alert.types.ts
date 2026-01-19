export type GoogleAdsAlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type GoogleAdsAlertType = 
  | 'budget_limited'      // Perdendo impressões por falta de orçamento
  | 'below_minimum'       // Gastando abaixo do mínimo recomendado
  | 'low_performance';    // Share muito baixo + limitado por budget

export interface GoogleAdsAlert {
  client: string;
  account_id: string;
  account_name: string;
  campaign_name: string;
  campaign_id: string;
  
  // Métricas atuais
  current_daily_spend: number;
  search_impression_share: number;
  budget_lost_impression_share: number;
  
  // Recomendações
  recommended_budget: number;
  budget_increase_needed: number;
  budget_increase_percentage: number;
  
  // Impacto
  impressions_lost_per_day: number;
  estimated_clicks_lost: number;
  potential_revenue_impact: number;
  
  // Classificação
  severity: GoogleAdsAlertSeverity;
  alert_type: GoogleAdsAlertType;
  alert_date: string;
}

export interface GoogleAdsAlertSummary {
  total_campaigns_affected: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  total_daily_opportunity_lost: number;
  alerts: GoogleAdsAlert[];
}

export interface AlertTypeConfig {
  title: string;
  description: string;
  icon: string;
  actionLabel: string;
}
