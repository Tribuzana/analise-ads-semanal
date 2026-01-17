import { MetricCard } from '@/components/dashboard/MetricCard'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  MousePointerClick,
  Eye,
  Target,
} from 'lucide-react'
import type { CampaignData } from '@/types/marketing'

interface GoogleAdsMetricsProps {
  campaigns: CampaignData[]
  comparisonCampaigns?: CampaignData[]
}

export function GoogleAdsMetrics({ campaigns, comparisonCampaigns }: GoogleAdsMetricsProps) {
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

  // Calcular métricas do período anterior se disponível
  const previousSpend = comparisonCampaigns?.reduce((sum, c) => sum + c.spend, 0) || 0
  const previousRevenue = comparisonCampaigns?.reduce((sum, c) => sum + c.revenue, 0) || 0
  const previousConversions = comparisonCampaigns?.reduce((sum, c) => sum + c.conversions, 0) || 0
  const previousClicks = comparisonCampaigns?.reduce((sum, c) => sum + c.clicks, 0) || 0
  const previousImpressions = comparisonCampaigns?.reduce((sum, c) => sum + c.impressions, 0) || 0
  
  const previousRoas = previousSpend > 0 ? previousRevenue / previousSpend : 0
  const previousCpa = previousConversions > 0 ? previousSpend / previousConversions : 0
  const previousCpc = previousClicks > 0 ? previousSpend / previousClicks : 0
  const previousCtr = previousImpressions > 0 ? (previousClicks / previousImpressions) * 100 : 0
  const previousConversionRate = previousClicks > 0 ? (previousConversions / previousClicks) * 100 : 0

  // Calcular deltas percentuais
  const calculateDelta = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const hasComparison = comparisonCampaigns && comparisonCampaigns.length > 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Investimento"
        value={formatCurrency(totalSpend)}
        icon={<DollarSign className="h-4 w-4" />}
        subtitle={`${campaigns.length} campanhas ativas`}
        change={hasComparison ? calculateDelta(totalSpend, previousSpend) : undefined}
        compareValue={hasComparison ? formatCurrency(previousSpend) : undefined}
      />

      <MetricCard
        title="Receita"
        value={formatCurrency(totalRevenue)}
        icon={<TrendingUp className="h-4 w-4" />}
        subtitle={`ROAS: ${roas.toFixed(2)}`}
        change={hasComparison ? calculateDelta(totalRevenue, previousRevenue) : undefined}
        compareValue={hasComparison ? formatCurrency(previousRevenue) : undefined}
      />

      <MetricCard
        title="Conversões"
        value={formatNumber(totalConversions)}
        icon={<ShoppingCart className="h-4 w-4" />}
        subtitle={`CPA: ${formatCurrency(cpa)}`}
        change={hasComparison ? calculateDelta(totalConversions, previousConversions) : undefined}
        compareValue={hasComparison ? formatNumber(previousConversions) : undefined}
      />

      <MetricCard
        title="Taxa de Conversão"
        value={formatPercentage(conversionRate)}
        icon={<Target className="h-4 w-4" />}
        subtitle={`${formatNumber(totalClicks)} cliques`}
        change={hasComparison ? calculateDelta(conversionRate, previousConversionRate) : undefined}
        compareValue={hasComparison ? formatPercentage(previousConversionRate) : undefined}
      />

      <MetricCard
        title="Cliques"
        value={formatNumber(totalClicks)}
        icon={<MousePointerClick className="h-4 w-4" />}
        subtitle={`CPC: ${formatCurrency(cpc)}`}
        change={hasComparison ? calculateDelta(totalClicks, previousClicks) : undefined}
        compareValue={hasComparison ? formatNumber(previousClicks) : undefined}
      />

      <MetricCard
        title="Impressões"
        value={formatNumber(totalImpressions)}
        icon={<Eye className="h-4 w-4" />}
        subtitle={`CTR: ${formatPercentage(ctr)}`}
        change={hasComparison ? calculateDelta(totalImpressions, previousImpressions) : undefined}
        compareValue={hasComparison ? formatNumber(previousImpressions) : undefined}
      />
    </div>
  )
}
