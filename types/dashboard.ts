export interface MetricCard {
  label: string
  value: string | number
  change?: number
  compareValue?: string | number
}

export interface PlatformMetrics {
  investment: number
  revenue: number
  conversions: number
  roas: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  cpa: number
}

export interface ComparisonMetrics {
  previous: PlatformMetrics
  delta: {
    investment: number // percentual
    revenue: number
    conversions: number
    roas: number
    clicks: number
    impressions: number
    ctr: number
    cpc: number
    cpa: number
  }
}

export interface DashboardMetrics {
  geral: PlatformMetrics
  googleAds: PlatformMetrics
  metaAds: PlatformMetrics
  comparison?: {
    geral: ComparisonMetrics
    googleAds: ComparisonMetrics
    metaAds: ComparisonMetrics
  }
}

export interface DashboardPeriodComparison {
  current: DashboardMetrics
  previous: DashboardMetrics
  delta: {
    spend: number
    revenue: number
    conversions: number
    roas: number
    cpa: number
    ctr: number
  }
}
