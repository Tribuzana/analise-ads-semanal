'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, AlertCircle, Banknote } from 'lucide-react';
import { useBalanceAlerts } from '@/hooks/useBalanceAlerts';
import { BalanceAlertService } from '@/services/balance-alert.service';
import type { BalanceAlert } from '@/types/balance-alert.types';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function BalanceAlertCard() {
  const { alerts, hasAlerts, loading } = useBalanceAlerts();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!hasAlerts || loading) return null;

  return (
    <Card
      id="balance-alert-card"
      className="border-t-4 border-t-destructive shadow-sm"
    >
      <CardHeader className="p-4 pb-2 space-y-0 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-base font-semibold">
            Saldo Insuficiente - Meta Ads
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
          <p className="text-xs text-muted-foreground">
            Baseado no fechamento de ontem ({alerts.alerts[0]?.alert_date}).
          </p>
          <div className="grid gap-3 grid-cols-1">
            {alerts.alerts.map((alert) => (
              <AccountAlertItem key={alert.account_id} alert={alert} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Componente de item individual
function AccountAlertItem({ alert }: { alert: BalanceAlert }) {
  const config = BalanceAlertService.getSeverityConfig(alert.severity);

  return (
    <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-bold truncate">{alert.client}</h4>
          <p className="text-[10px] text-muted-foreground truncate">{alert.account_name}</p>
        </div>
        <Badge variant="outline" className={cn("text-[10px] h-5 font-bold", config.badgeColor, "border-none")}>
          {config.badge}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
            Investimento Ontem
          </p>
          <p className="text-sm font-semibold">{BalanceAlertService.formatBRL(alert.spend_yesterday)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
            Projeção 7 Dias
          </p>
          <p className="text-sm font-semibold">{BalanceAlertService.formatBRL(alert.projected_7days)}</p>
        </div>
      </div>

      <div className={cn("rounded-md p-3 mb-3 border", config.bgColor, config.borderColor, "bg-opacity-50")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase opacity-70 mb-0.5">Saldo Disponível</p>
            <p className="text-lg font-bold">{BalanceAlertService.formatBRL(alert.available_balance)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-0.5">Dias Restantes</p>
            <p className="text-base font-bold">{BalanceAlertService.formatDaysRemaining(alert.days_remaining)}</p>
          </div>
        </div>
      </div>

      <Button
        asChild
        size="sm"
        className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white text-[11px] h-8 gap-1.5"
      >
        <a
          href={`https://business.facebook.com/adsmanager/manage/accounts?act=${alert.account_id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Adicionar Saldo
          <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
    </div>
  );
}
