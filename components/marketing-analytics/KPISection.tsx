import { MetricCard } from '@/components/dashboard/MetricCard'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { TrendingUp, DollarSign, ShoppingCart, Target } from 'lucide-react'
import type { MarketingAnalyticsData } from '@/types/marketing'

interface KPISectionProps {
  data: MarketingAnalyticsData
}

export function KPISection({ data }: KPISectionProps) {
  const totalSpend = data.campaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalRevenue = data.campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const totalConversions = data.campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const averageCPA = totalConversions > 0 ? totalSpend / totalConversions : 0
  const totalClicks = data.campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0

  // Calcular métricas do período anterior se disponível
  const previousCampaigns = data.comparison?.campaigns || []
  const previousSpend = previousCampaigns.reduce((sum, c) => sum + c.spend, 0)
  const previousRevenue = previousCampaigns.reduce((sum, c) => sum + c.revenue, 0)
  const previousConversions = previousCampaigns.reduce((sum, c) => sum + c.conversions, 0)
  const previousAverageROAS = previousSpend > 0 ? previousRevenue / previousSpend : 0
  const previousAverageCPA = previousConversions > 0 ? previousSpend / previousConversions : 0
  const previousClicks = previousCampaigns.reduce((sum, c) => sum + c.clicks, 0)
  const previousAverageCPC = previousClicks > 0 ? previousSpend / previousClicks : 0

  // Calcular deltas percentuais
  const calculateDelta = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const hasComparison = data.comparison && previousCampaigns.length > 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total de Campanhas"
        value={data.campaigns.length}
        icon={<Target className="h-4 w-4" />}
        change={hasComparison ? calculateDelta(data.campaigns.length, previousCampaigns.length) : undefined}
        compareValue={hasComparison ? previousCampaigns.length : undefined}
      />

      <MetricCard
        title="Investimento Total"
        value={formatCurrency(totalSpend)}
        icon={<DollarSign className="h-4 w-4" />}
        change={hasComparison ? calculateDelta(totalSpend, previousSpend) : undefined}
        compareValue={hasComparison ? formatCurrency(previousSpend) : undefined}
      />

      <MetricCard
        title="Receita Total"
        value={formatCurrency(totalRevenue)}
        icon={<TrendingUp className="h-4 w-4" />}
        change={hasComparison ? calculateDelta(totalRevenue, previousRevenue) : undefined}
        compareValue={hasComparison ? formatCurrency(previousRevenue) : undefined}
      />

      <MetricCard
        title="ROAS Médio"
        value={averageROAS.toFixed(2)}
        icon={<TrendingUp className="h-4 w-4" />}
        change={hasComparison ? calculateDelta(averageROAS, previousAverageROAS) : undefined}
        compareValue={hasComparison ? previousAverageROAS.toFixed(2) : undefined}
      />

      <MetricCard
        title="CPA Médio"
        value={formatCurrency(averageCPA)}
        icon={<DollarSign className="h-4 w-4" />}
        change={hasComparison ? calculateDelta(averageCPA, previousAverageCPA) : undefined}
        compareValue={hasComparison ? formatCurrency(previousAverageCPA) : undefined}
      />

      <MetricCard
        title="CPC Médio"
        value={formatCurrency(averageCPC)}
        icon={<DollarSign className="h-4 w-4" />}
        change={hasComparison ? calculateDelta(averageCPC, previousAverageCPC) : undefined}
        compareValue={hasComparison ? formatCurrency(previousAverageCPC) : undefined}
      />

      <MetricCard
        title="Total de Conversões"
        value={formatNumber(totalConversions)}
        icon={<ShoppingCart className="h-4 w-4" />}
        change={hasComparison ? calculateDelta(totalConversions, previousConversions) : undefined}
        compareValue={hasComparison ? formatNumber(previousConversions) : undefined}
      />
    </div>
  )
}
