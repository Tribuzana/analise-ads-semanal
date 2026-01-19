import { createClient } from '@/lib/supabase/client';
import type { 
  GoogleAdsAlert, 
  GoogleAdsAlertSummary,
  GoogleAdsAlertType,
  GoogleAdsAlertSeverity,
  AlertTypeConfig
} from '@/types/google-ads-alert.types';

export class GoogleAdsAlertService {
  /**
   * Busca alertas de Google Ads para o usuário
   */
  static async getAlerts(
    userId?: string,
    userRole?: string
  ): Promise<GoogleAdsAlertSummary> {
    try {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .rpc('get_google_ads_budget_alerts', { 
          p_user_id: userId || null, 
          p_user_role: userRole || null 
        });

      if (error) throw error;

      const alerts = data as GoogleAdsAlert[];

      return {
        total_campaigns_affected: alerts.length,
        critical_count: alerts.filter(a => a.severity === 'critical').length,
        high_count: alerts.filter(a => a.severity === 'high').length,
        medium_count: alerts.filter(a => a.severity === 'medium').length,
        total_daily_opportunity_lost: alerts.reduce((sum, a) => sum + (a.potential_revenue_impact || 0), 0),
        alerts
      };
    } catch (error) {
      console.error('Erro ao buscar alertas Google Ads:', error);
      return {
        total_campaigns_affected: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        total_daily_opportunity_lost: 0,
        alerts: []
      };
    }
  }

  /**
   * Configurações visuais por severidade
   */
  static getSeverityConfig(severity: GoogleAdsAlertSeverity) {
    const configs = {
      critical: {
        badge: 'CRÍTICO',
        badgeColor: 'bg-red-100 text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-600',
        textColor: 'text-red-900',
        message: 'Perdendo mais de 30% das impressões'
      },
      high: {
        badge: 'ALTO',
        badgeColor: 'bg-orange-100 text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-900',
        message: 'Perdendo 15-30% das impressões'
      },
      medium: {
        badge: 'MÉDIO',
        badgeColor: 'bg-amber-100 text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-500',
        textColor: 'text-amber-900',
        message: 'Perdendo 5-15% das impressões'
      },
      low: {
        badge: 'BAIXO',
        badgeColor: 'bg-emerald-100 text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-900',
        message: 'Pequena limitação detectada'
      }
    };
    
    return configs[severity];
  }

  /**
   * Configurações por tipo de alerta
   */
  static getAlertTypeConfig(alertType: GoogleAdsAlertType): AlertTypeConfig {
    const configs: Record<GoogleAdsAlertType, AlertTypeConfig> = {
      budget_limited: {
        title: 'Limitado por Orçamento',
        description: 'Campanha está perdendo impressões por falta de orçamento diário',
        icon: 'Wallet',
        actionLabel: 'Aumentar Orçamento'
      },
      below_minimum: {
        title: 'Abaixo do Mínimo',
        description: 'Gasto diário está abaixo do orçamento mínimo recomendado',
        icon: 'ArrowDownCircle',
        actionLabel: 'Ajustar para Mínimo'
      },
      low_performance: {
        title: 'Performance Baixa',
        description: 'Share de impressões muito baixo devido a limitação de orçamento',
        icon: 'TrendingDown',
        actionLabel: 'Melhorar Performance'
      }
    };
    
    return configs[alertType];
  }

  /**
   * Formata BRL
   */
  static formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata percentual
   */
  static formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Formata número com separador de milhares
   */
  static formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }
}
