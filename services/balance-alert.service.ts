import { createClient } from '@/lib/supabase/client';
import type { BalanceAlert, BalanceAlertSummary } from '@/types/balance-alert.types';

export class BalanceAlertService {
  /**
   * Busca alertas de saldo para o usuário atual
   */
  static async getAlerts(
    userId?: string,
    userRole?: string
  ): Promise<BalanceAlertSummary> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('get_balance_alerts', { 
          p_user_id: userId || null, 
          p_user_role: userRole || null 
        });

      if (error) throw error;

      const alerts = data as BalanceAlert[];

      return {
        total_alerts: alerts.length,
        critical_count: alerts.filter(a => a.severity === 'critical').length,
        warning_count: alerts.filter(a => a.severity === 'warning').length,
        alerts
      };
    } catch (error) {
      console.error('Erro ao buscar alertas de saldo:', error);
      return {
        total_alerts: 0,
        critical_count: 0,
        warning_count: 0,
        alerts: []
      };
    }
  }

  /**
   * Formata valores em BRL
   */
  static formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata dias restantes
   */
  static formatDaysRemaining(days: number): string {
    if (days < 1) return 'Menos de 1 dia';
    if (days < 2) return `~${days.toFixed(1)} dia`;
    return `~${days.toFixed(1)} dias`;
  }

  /**
   * Retorna configuração visual por severidade
   */
  static getSeverityConfig(severity: BalanceAlert['severity']) {
    const configs = {
      critical: {
        badge: 'CRÍTICO',
        badgeColor: 'bg-red-100 text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-600'
      },
      warning: {
        badge: 'ATENÇÃO',
        badgeColor: 'bg-amber-100 text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-500'
      },
      ok: {
        badge: 'OK',
        badgeColor: 'bg-emerald-100 text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500'
      }
    };
    
    return configs[severity];
  }
}
