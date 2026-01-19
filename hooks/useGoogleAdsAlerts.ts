import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GoogleAdsAlertService } from '@/services/google-ads-alert.service';
import type { GoogleAdsAlertSummary } from '@/types/google-ads-alert.types';

export function useGoogleAdsAlerts() {
  const { user, usuario } = useAuth();
  const [alerts, setAlerts] = useState<GoogleAdsAlertSummary>({
    total_campaigns_affected: 0,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    total_daily_opportunity_lost: 0,
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
        const data = await GoogleAdsAlertService.getAlerts(
          usuario?.id || user.id,
          usuario?.nivel_acesso
        );
        setAlerts(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar alertas Google Ads:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
    // Nota: Polling removido conforme lógica D-1 estabelecida anteriormente
  }, [user, usuario?.id, usuario?.nivel_acesso]);

  return {
    alerts,
    loading,
    error,
    hasAlerts: alerts.total_campaigns_affected > 0,
    hasCriticalAlerts: alerts.critical_count > 0,
    hasHighAlerts: alerts.high_count > 0,
    hasMediumAlerts: alerts.medium_count > 0
  };
}
