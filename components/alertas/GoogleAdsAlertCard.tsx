'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, TrendingUp, AlertCircle, BarChart3, Target, MousePointer2 } from 'lucide-react';
import { useGoogleAdsAlerts } from '@/hooks/useGoogleAdsAlerts';
import { GoogleAdsAlertService } from '@/services/google-ads-alert.service';
import type { GoogleAdsAlert } from '@/types/google-ads-alert.types';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function GoogleAdsAlertCard() {
  const { alerts, hasAlerts, loading } = useGoogleAdsAlerts();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!hasAlerts || loading) return null;

  return (
    <Card className="border-t-4 border-t-orange-500 shadow-sm">
      <CardHeader className="p-4 pb-2 space-y-0 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-base font-semibold">
            Limitação de Orçamento - Google Ads
          </CardTitle>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-muted rounded-md transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {alerts.total_campaigns_affected} {alerts.total_campaigns_affected === 1 ? 'campanha afetada' : 'campanhas afetadas'}.
            </p>
            {alerts.total_daily_opportunity_lost > 0 && (
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">
                Perda diária: {GoogleAdsAlertService.formatBRL(alerts.total_daily_opportunity_lost)}
              </p>
            )}
          </div>
          <div className="grid gap-3 grid-cols-1">
            {alerts.alerts.map((alert) => (
              <GoogleAdsCampaignAlertItem key={alert.campaign_id} alert={alert} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Item individual de campanha
function GoogleAdsCampaignAlertItem({ alert }: { alert: GoogleAdsAlert }) {
  const severityConfig = GoogleAdsAlertService.getSeverityConfig(alert.severity);
  const typeConfig = GoogleAdsAlertService.getAlertTypeConfig(alert.alert_type);

  const getTypeIcon = () => {
    switch (alert.alert_type) {
      case 'budget_limited': return <TrendingUp className="w-3.5 h-3.5" />;
      case 'below_minimum': return <BarChart3 className="w-3.5 h-3.5" />;
      case 'low_performance': return <Target className="w-3.5 h-3.5" />;
      default: return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-bold truncate">{alert.client}</h4>
          <p className="text-[10px] text-muted-foreground truncate">{alert.campaign_name}</p>
        </div>
        <Badge variant="outline" className={cn("text-[10px] h-5 font-bold", severityConfig.badgeColor, "border-none")}>
          {severityConfig.badge}
        </Badge>
      </div>

      <div className={cn("mb-3 p-2.5 rounded-md border", severityConfig.bgColor, severityConfig.borderColor, "bg-opacity-40")}>
        <div className="flex items-center gap-2 mb-1">
          <MousePointer2 className="w-3.5 h-3.5 opacity-70" />
          <p className="text-[11px] font-bold">{typeConfig.title}</p>
        </div>
        <p className="text-[10px] opacity-80 leading-tight">{typeConfig.description}</p>
        {alert.budget_lost_impression_share > 0 && (
          <p className="text-[10px] mt-1.5 font-bold flex items-center gap-1.5">
            {getTypeIcon()}
            Perda: {GoogleAdsAlertService.formatPercentage(alert.budget_lost_impression_share)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight mb-0.5">Gasto Atual</p>
          <p className="text-xs font-semibold">{GoogleAdsAlertService.formatBRL(alert.current_daily_spend)}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight mb-0.5">Recomendado</p>
          <p className="text-xs font-bold text-emerald-600">
            {GoogleAdsAlertService.formatBRL(alert.recommended_budget)}
            {alert.budget_increase_percentage > 0 && (
              <span className="text-[9px] ml-1 opacity-60">+{alert.budget_increase_percentage.toFixed(0)}%</span>
            )}
          </p>
        </div>
        {alert.impressions_lost_per_day > 0 && (
          <>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight mb-0.5">Imp. Perdidas</p>
              <p className="text-xs font-semibold text-red-600">{GoogleAdsAlertService.formatNumber(alert.impressions_lost_per_day)}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight mb-0.5">Cliques Perdidos</p>
              <p className="text-xs font-semibold text-red-600">~{Math.round(alert.estimated_clicks_lost)}</p>
            </div>
          </>
        )}
      </div>

      {alert.potential_revenue_impact > 0 && (
        <div className="bg-red-50/50 border border-red-100 rounded-md p-2.5 mb-4 flex items-center justify-between">
          <p className="text-[10px] text-red-700 font-bold uppercase tracking-tight">Oportunidade Perdida</p>
          <p className="text-sm font-black text-red-600">{GoogleAdsAlertService.formatBRL(alert.potential_revenue_impact)}</p>
        </div>
      )}

      <Button
        asChild
        size="sm"
        className="w-full bg-[#4285F4] hover:bg-[#357abd] text-white text-[11px] h-8 gap-1.5"
      >
        <a
          href={`https://ads.google.com/aw/campaigns?campaignId=${alert.campaign_id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {typeConfig.actionLabel}
          <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
    </div>
  );
}
