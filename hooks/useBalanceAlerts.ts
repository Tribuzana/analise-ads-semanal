import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BalanceAlertService } from '@/services/balance-alert.service';
import type { BalanceAlertSummary } from '@/types/balance-alert.types';

export function useBalanceAlerts() {
  const { user, usuario } = useAuth();
  const [alerts, setAlerts] = useState<BalanceAlertSummary>({
    total_alerts: 0,
    critical_count: 0,
    warning_count: 0,
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Usar usuario.id e usuario.nivel_acesso para permissões
        const data = await BalanceAlertService.getAlerts(
          usuario?.id || user.id,
          usuario?.nivel_acesso
        );
        setAlerts(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar alertas de saldo:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
    // Nota: Polling removido conforme solicitado, dados são D-1
  }, [user, usuario?.id, usuario?.nivel_acesso]);

  return {
    alerts,
    loading,
    error,
    hasAlerts: alerts.total_alerts > 0,
    hasCriticalAlerts: alerts.critical_count > 0,
    hasWarningAlerts: alerts.warning_count > 0
  };
}
