export interface BalanceAlert {
  client: string;                    // Nome do hotel
  account_id: string;
  account_name: string;
  spend_yesterday: number;
  projected_7days: number;
  available_balance: number;
  days_remaining: number;
  severity: 'critical' | 'warning' | 'ok';
  alert_date: string;                // Data do alerta (D-1)
}

export interface BalanceAlertSummary {
  total_alerts: number;
  critical_count: number;
  warning_count: number;
  alerts: BalanceAlert[];
}
