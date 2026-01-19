'use client';

import { useState } from 'react';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';
import { useBalanceAlerts } from '@/hooks/useBalanceAlerts';
import { useGoogleAdsAlerts } from '@/hooks/useGoogleAdsAlerts';
import { cn } from '@/lib/utils/cn';

export function TopAlertBar() {
  const metaAlerts = useBalanceAlerts();
  const googleAlerts = useGoogleAdsAlerts();
  const [isVisible, setIsVisible] = useState(true);

  const totalAlertsCount = metaAlerts.alerts.total_alerts + googleAlerts.alerts.total_campaigns_affected;
  
  if (totalAlertsCount === 0 || !isVisible || metaAlerts.loading || googleAlerts.loading) {
    return null;
  }

  const hasCritical = metaAlerts.hasCriticalAlerts || googleAlerts.hasCriticalAlerts;
  const hasHigh = metaAlerts.hasWarningAlerts || googleAlerts.hasHighAlerts;

  const getSeverityStyles = () => {
    if (hasCritical) return "bg-red-50 border-b-red-600 text-red-900";
    if (hasHigh) return "bg-orange-50 border-b-orange-500 text-orange-900";
    return "bg-amber-50 border-b-amber-500 text-amber-900";
  };

  const Icon = hasCritical ? AlertCircle : AlertTriangle;

  const scrollToInsights = () => {
    const element = document.getElementById('insights-automaticos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = '/marketing-analytics#insights-automaticos';
    }
  };

  const getMessage = () => {
    const parts = [];
    if (metaAlerts.hasAlerts) {
      parts.push(`${metaAlerts.alerts.total_alerts} Meta Ads`);
    }
    if (googleAlerts.hasAlerts) {
      parts.push(`${googleAlerts.alerts.total_campaigns_affected} Google Ads`);
    }
    return parts.join(' • ');
  };

  return (
    <div
      className={cn(
        "z-50 animate-in slide-in-from-top border-b shrink-0",
        getSeverityStyles()
      )}
    >
      <div className="mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {totalAlertsCount === 1 
                  ? '1 alerta de orçamento detectado'
                  : `${totalAlertsCount} alertas de orçamento detectados`
                }
              </p>
              <p className="text-xs opacity-80 truncate">
                {getMessage()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollToInsights}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium text-xs whitespace-nowrap"
            >
              Ver detalhes
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1.5 hover:bg-black/5 rounded-md transition-colors"
              aria-label="Fechar alerta"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
