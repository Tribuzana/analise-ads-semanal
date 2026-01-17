'use client'

import { useState } from 'react'
import { useDashboard } from '@/hooks/useDashboard'
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics'
import { useLast4Weeks } from '@/hooks/useLast4Weeks'
import { useFilterContext } from '@/contexts/FilterContext'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { SparklineCard } from '@/components/dashboard/SparklineCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'
import { LineChart } from '@/components/charts/LineChart'
import { PieChart } from '@/components/charts/PieChart'
import { BarChart } from '@/components/charts/BarChart'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { groupDataByWeek } from '@/lib/utils/dashboard-helpers'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  MousePointerClick,
  Eye,
  PlayCircle,
  PauseCircle,
} from 'lucide-react'

/**
 * Calcula o delta percentual comparando a primeira metade com a segunda metade do período
 */
function calculateDelta(data: number[]): { delta: number; isPositive: boolean } {
  if (!data || data.length < 2) {
    return { delta: 0, isPositive: true }
  }

  // Garantir que temos pelo menos 2 pontos para comparar
  if (data.length === 2) {
    const first = data[0] || 0
    const second = data[1] || 0
    if (first === 0) {
      return { delta: second > 0 ? 100 : 0, isPositive: second >= first }
    }
    const delta = ((second - first) / first) * 100
    return { delta: Math.abs(delta), isPositive: delta >= 0 }
  }

  const midPoint = Math.max(1, Math.floor(data.length / 2))
  const firstHalf = data.slice(0, midPoint)
  const secondHalf = data.slice(midPoint)

  const firstAvg = firstHalf.reduce((sum, val) => sum + (val || 0), 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + (val || 0), 0) / secondHalf.length

  if (firstAvg === 0) {
    return { delta: secondAvg > 0 ? 100 : 0, isPositive: secondAvg >= firstAvg }
  }

  const delta = ((secondAvg - firstAvg) / firstAvg) * 100
  return { delta: Math.abs(delta), isPositive: delta >= 0 }
}

/**
 * Gera dados do sparkline a partir dos dados temporais
 */
function generateSparklineData(
  temporalData: Array<{ spend: number; revenue: number; conversions: number; roas: number; date: string }>,
  field: 'spend' | 'revenue' | 'conversions' | 'roas'
): { data: number[]; dates: string[] } {
  if (!temporalData || temporalData.length === 0) {
    return { data: [], dates: [] }
  }

  return {
    data: temporalData.map(d => d[field] || 0),
    dates: temporalData.map(d => d.date),
  }
}

export default function DashboardPage() {
  const { metrics, loading, error } = useDashboard()
  const { data: analyticsData } = useMarketingAnalytics()
  const { temporalData: last4WeeksData, campaignKPIs, loading: loading4Weeks } = useLast4Weeks()
  const { compareYearAgo } = useFilterContext()
  const [weeklyView, setWeeklyView] = useState(false)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das campanhas Google Ads e Meta Ads
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[140px]" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium text-red-600">Erro ao carregar dados</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="text-xs text-muted-foreground mt-4 p-4 bg-muted rounded-lg">
            <p><strong>Dica:</strong> Verifique:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Se você está autenticado (veja seu nome no canto superior direito)</li>
              <li>Se as datas dos filtros estão definidas</li>
              <li>O console do navegador para mais detalhes</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-10 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das campanhas Google Ads e Meta Ads
        </p>
      </div>

      {/* Campanhas Ativas/Pausadas */}
      <div className="py-6">
        <h2 className="text-xl font-semibold mb-6">Status das Campanhas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Campanhas Ativas Google"
            value={formatNumber(campaignKPIs.activeGoogle)}
            icon={<PlayCircle className="h-4 w-4" />}
          />
          <MetricCard
            title="Campanhas Pausadas Google"
            value={formatNumber(campaignKPIs.pausedGoogle)}
            icon={<PauseCircle className="h-4 w-4" />}
          />
          <MetricCard
            title="Campanhas Ativas Meta"
            value={formatNumber(campaignKPIs.activeMeta)}
            icon={<PlayCircle className="h-4 w-4" />}
          />
          <MetricCard
            title="Campanhas Pausadas Meta"
            value={formatNumber(campaignKPIs.pausedMeta)}
            icon={<PauseCircle className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Insights Automáticos */}
      {analyticsData && (
        <InsightsPanel
          analyticsData={analyticsData}
          dashboardMetrics={metrics}
        />
      )}

      {/* Métricas Gerais */}
      <div className="py-6">
        <h2 className="text-xl font-semibold mb-6">Métricas Gerais</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {analyticsData?.temporalData && analyticsData.temporalData.length > 0 ? (
            <>
              {/* Investimento Total */}
              {(() => {
                const { data: sparklineData, dates } = generateSparklineData(analyticsData.temporalData, 'spend')
                const { delta, isPositive } = metrics.comparison
                  ? { delta: metrics.comparison.geral.delta.investment, isPositive: metrics.comparison.geral.delta.investment >= 0 }
                  : calculateDelta(sparklineData)
                const compareValue = metrics.comparison
                  ? formatCurrency(metrics.comparison.geral.previous.investment)
                  : undefined
                return (
                  <SparklineCard
                    label="Investimento Total"
                    value={formatCurrency(metrics.geral.investment)}
                    delta={delta}
                    isPositive={isPositive}
                    data={sparklineData}
                    dates={dates}
                    valueType="currency"
                    compareValue={compareValue}
                  />
                )
              })()}

              {/* Receita Total */}
              {(() => {
                const { data: sparklineData, dates } = generateSparklineData(analyticsData.temporalData, 'revenue')
                const { delta, isPositive } = metrics.comparison
                  ? { delta: metrics.comparison.geral.delta.revenue, isPositive: metrics.comparison.geral.delta.revenue >= 0 }
                  : calculateDelta(sparklineData)
                const compareValue = metrics.comparison
                  ? formatCurrency(metrics.comparison.geral.previous.revenue)
                  : undefined
                return (
                  <SparklineCard
                    label="Receita Total"
                    value={formatCurrency(metrics.geral.revenue)}
                    delta={delta}
                    isPositive={isPositive}
                    data={sparklineData}
                    dates={dates}
                    valueType="currency"
                    compareValue={compareValue}
                  />
                )
              })()}

              {/* Conversões */}
              {(() => {
                const { data: sparklineData, dates } = generateSparklineData(analyticsData.temporalData, 'conversions')
                const { delta, isPositive } = metrics.comparison
                  ? { delta: metrics.comparison.geral.delta.conversions, isPositive: metrics.comparison.geral.delta.conversions >= 0 }
                  : calculateDelta(sparklineData)
                const compareValue = metrics.comparison
                  ? formatNumber(metrics.comparison.geral.previous.conversions)
                  : undefined
                return (
                  <SparklineCard
                    label="Conversões"
                    value={formatNumber(metrics.geral.conversions)}
                    delta={delta}
                    isPositive={isPositive}
                    data={sparklineData}
                    dates={dates}
                    valueType="number"
                    compareValue={compareValue}
                  />
                )
              })()}

              {/* ROAS */}
              {(() => {
                const { data: sparklineData, dates } = generateSparklineData(analyticsData.temporalData, 'roas')
                const { delta, isPositive } = compareYearAgo && metrics.comparison
                  ? { delta: metrics.comparison.geral.delta.roas, isPositive: metrics.comparison.geral.delta.roas >= 0 }
                  : calculateDelta(sparklineData)
                const compareValue = compareYearAgo && metrics.comparison
                  ? metrics.comparison.geral.previous.roas.toFixed(2)
                  : undefined
                return (
                  <SparklineCard
                    label="ROAS"
                    value={metrics.geral.roas.toFixed(2)}
                    delta={delta}
                    isPositive={isPositive}
                    data={sparklineData}
                    dates={dates}
                    valueType="decimal"
                    compareValue={compareValue}
                  />
                )
              })()}
            </>
          ) : (
            <>
              <MetricCard
                title="Investimento Total"
                value={formatCurrency(metrics.geral.investment)}
                icon={<DollarSign className="h-4 w-4" />}
                change={metrics.comparison ? metrics.comparison.geral.delta.investment : undefined}
                compareValue={metrics.comparison ? formatCurrency(metrics.comparison.geral.previous.investment) : undefined}
              />
              <MetricCard
                title="Receita Total"
                value={formatCurrency(metrics.geral.revenue)}
                icon={<TrendingUp className="h-4 w-4" />}
                change={metrics.comparison ? metrics.comparison.geral.delta.revenue : undefined}
                compareValue={metrics.comparison ? formatCurrency(metrics.comparison.geral.previous.revenue) : undefined}
              />
              <MetricCard
                title="Conversões"
                value={formatNumber(metrics.geral.conversions)}
                icon={<ShoppingCart className="h-4 w-4" />}
                change={metrics.comparison ? metrics.comparison.geral.delta.conversions : undefined}
                compareValue={metrics.comparison ? formatNumber(metrics.comparison.geral.previous.conversions) : undefined}
              />
              <MetricCard
                title="ROAS"
                value={metrics.geral.roas.toFixed(2)}
                subtitle={metrics.comparison ? undefined : "Return on Ad Spend"}
                icon={<TrendingUp className="h-4 w-4" />}
                change={metrics.comparison ? metrics.comparison.geral.delta.roas : undefined}
                compareValue={metrics.comparison ? metrics.comparison.geral.previous.roas.toFixed(2) : undefined}
              />
            </>
          )}
        </div>
      </div>

      {/* Gráficos das Últimas 4 Semanas */}
      {last4WeeksData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Últimas 4 Semanas</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="weekly-toggle" className="text-sm text-muted-foreground">
                Diário
              </Label>
              <Switch
                id="weekly-toggle"
                checked={weeklyView}
                onCheckedChange={setWeeklyView}
              />
              <Label htmlFor="weekly-toggle" className="text-sm text-muted-foreground">
                Semanal (Dom-Sáb)
              </Label>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(() => {
              const chartData = weeklyView 
                ? groupDataByWeek(last4WeeksData)
                : last4WeeksData.map(d => ({
                    ...d,
                    weekLabel: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                  }))

              const getDateLabel = (d: typeof chartData[0]) => {
                if (weeklyView && 'weekLabel' in d) {
                  return d.weekLabel
                }
                return new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              }

              return (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Investimento</CardTitle>
                      <CardDescription>
                        {weeklyView 
                          ? 'Investimento acumulado por semana (domingo a sábado)'
                          : 'Investimento diário das últimas 4 semanas'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LineChart
                        data={chartData.map(d => ({
                          date: getDateLabel(d),
                          Investimento: d.spend,
                        }))}
                        dataKeys={[
                          { key: 'Investimento', name: 'Investimento', color: 'hsl(var(--primary))' },
                        ]}
                        yAxisFormatter={(value: any) => formatCurrency(value)}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Receita</CardTitle>
                      <CardDescription>
                        {weeklyView 
                          ? 'Receita acumulada por semana (domingo a sábado)'
                          : 'Receita diária das últimas 4 semanas'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LineChart
                        data={chartData.map(d => ({
                          date: getDateLabel(d),
                          Receita: d.revenue,
                        }))}
                        dataKeys={[
                          { key: 'Receita', name: 'Receita', color: '#82ca9d' },
                        ]}
                        yAxisFormatter={(value: any) => formatCurrency(value)}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>ROAS</CardTitle>
                      <CardDescription>
                        {weeklyView 
                          ? 'ROAS médio por semana (domingo a sábado)'
                          : 'ROAS diário das últimas 4 semanas'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LineChart
                        data={chartData.map(d => ({
                          date: getDateLabel(d),
                          ROAS: d.roas,
                        }))}
                        dataKeys={[
                          { key: 'ROAS', name: 'ROAS', color: '#8884d8' },
                        ]}
                        yAxisFormatter={(value: any) => `${Number(value).toFixed(2).replace('.', ',')}x`}
                      />
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Evolução Temporal */}
      {analyticsData && analyticsData.temporalData.length > 0 && (
        <div className="py-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Temporal - Investimento vs Receita</CardTitle>
              <CardDescription>
                Comparação de investimento e receita ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={analyticsData.temporalData.map(d => ({
                  date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                  Investimento: d.spend,
                  Receita: d.revenue,
                }))}
                dataKeys={[
                  { key: 'Investimento', name: 'Investimento', color: 'hsl(var(--primary))' },
                  { key: 'Receita', name: 'Receita', color: '#82ca9d' },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Google Ads */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Google Ads</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Investimento"
            value={formatCurrency(metrics.googleAds.investment)}
            icon={<DollarSign className="h-4 w-4" />}
            change={metrics.comparison ? metrics.comparison.googleAds.delta.investment : undefined}
            compareValue={metrics.comparison ? formatCurrency(metrics.comparison.googleAds.previous.investment) : undefined}
          />
          <MetricCard
            title="Receita"
            value={formatCurrency(metrics.googleAds.revenue)}
            icon={<TrendingUp className="h-4 w-4" />}
            change={metrics.comparison ? metrics.comparison.googleAds.delta.revenue : undefined}
            compareValue={metrics.comparison ? formatCurrency(metrics.comparison.googleAds.previous.revenue) : undefined}
          />
          <MetricCard
            title="ROAS"
            value={metrics.googleAds.roas.toFixed(2)}
            change={metrics.comparison ? metrics.comparison.googleAds.delta.roas : undefined}
            compareValue={metrics.comparison ? metrics.comparison.googleAds.previous.roas.toFixed(2) : undefined}
          />
          <MetricCard
            title="CPA"
            value={formatCurrency(metrics.googleAds.cpa)}
            change={metrics.comparison ? metrics.comparison.googleAds.delta.cpa : undefined}
            compareValue={metrics.comparison ? formatCurrency(metrics.comparison.googleAds.previous.cpa) : undefined}
          />
          <MetricCard
            title="Cliques"
            value={formatNumber(metrics.googleAds.clicks)}
            icon={<MousePointerClick className="h-4 w-4" />}
            change={metrics.comparison ? metrics.comparison.googleAds.delta.clicks : undefined}
            compareValue={metrics.comparison ? formatNumber(metrics.comparison.googleAds.previous.clicks) : undefined}
          />
          <MetricCard
            title="Impressões"
            value={formatNumber(metrics.googleAds.impressions)}
            icon={<Eye className="h-4 w-4" />}
            change={metrics.comparison ? metrics.comparison.googleAds.delta.impressions : undefined}
            compareValue={metrics.comparison ? formatNumber(metrics.comparison.googleAds.previous.impressions) : undefined}
          />
          <MetricCard
            title="CTR"
            value={formatPercentage(metrics.googleAds.ctr)}
            change={metrics.comparison ? metrics.comparison.googleAds.delta.ctr : undefined}
            compareValue={metrics.comparison ? formatPercentage(metrics.comparison.googleAds.previous.ctr) : undefined}
          />
          <MetricCard
            title="CPC"
            value={formatCurrency(metrics.googleAds.cpc)}
            change={metrics.comparison ? metrics.comparison.googleAds.delta.cpc : undefined}
            compareValue={metrics.comparison ? formatCurrency(metrics.comparison.googleAds.previous.cpc) : undefined}
          />
        </div>
      </div>

      {/* Meta Ads */}
      <div className="py-6">
        <h2 className="text-xl font-semibold mb-6">Meta Ads</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Investimento"
            value={formatCurrency(metrics.metaAds.investment)}
            icon={<DollarSign className="h-4 w-4" />}
            change={metrics.comparison ? metrics.comparison.metaAds.delta.investment : undefined}
            compareValue={metrics.comparison ? formatCurrency(metrics.comparison.metaAds.previous.investment) : undefined}
          />
          <MetricCard
            title="Receita"
            value={formatCurrency(metrics.metaAds.revenue)}
            icon={<TrendingUp className="h-4 w-4" />}
            change={metrics.comparison ? metrics.comparison.metaAds.delta.revenue : undefined}
            compareValue={metrics.comparison ? formatCurrency(metrics.comparison.metaAds.previous.revenue) : undefined}
          />
          <MetricCard
            title="ROAS"
            value={metrics.metaAds.roas.toFixed(2)}
            change={metrics.comparison ? metrics.comparison.metaAds.delta.roas : undefined}
            compareValue={metrics.comparison ? metrics.comparison.metaAds.previous.roas.toFixed(2) : undefined}
          />
          <MetricCard
            title="CPA"
            value={formatCurrency(metrics.metaAds.cpa)}
            change={metrics.comparison ? metrics.comparison.metaAds.delta.cpa : undefined}
            compareValue={metrics.comparison ? formatCurrency(metrics.comparison.metaAds.previous.cpa) : undefined}
          />
          <MetricCard
            title="Cliques"
            value={formatNumber(metrics.metaAds.clicks)}
            icon={<MousePointerClick className="h-4 w-4" />}
            change={metrics.comparison ? metrics.comparison.metaAds.delta.clicks : undefined}
            compareValue={metrics.comparison ? formatNumber(metrics.comparison.metaAds.previous.clicks) : undefined}
          />
          <MetricCard
            title="Impressões"
            value={formatNumber(metrics.metaAds.impressions)}
            icon={<Eye className="h-4 w-4" />}
            change={metrics.comparison ? metrics.comparison.metaAds.delta.impressions : undefined}
            compareValue={metrics.comparison ? formatNumber(metrics.comparison.metaAds.previous.impressions) : undefined}
          />
          <MetricCard
            title="CTR"
            value={formatPercentage(metrics.metaAds.ctr)}
            change={metrics.comparison ? metrics.comparison.metaAds.delta.ctr : undefined}
            compareValue={metrics.comparison ? formatPercentage(metrics.comparison.metaAds.previous.ctr) : undefined}
          />
          <MetricCard
            title="CPC"
            value={formatCurrency(metrics.metaAds.cpc)}
            change={metrics.comparison ? metrics.comparison.metaAds.delta.cpc : undefined}
            compareValue={metrics.comparison ? formatCurrency(metrics.comparison.metaAds.previous.cpc) : undefined}
          />
        </div>
      </div>

      {/* Distribuição de Investimento */}
      {analyticsData && (
        <div className="py-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Investimento por Plataforma</CardTitle>
              <CardDescription>
                Investimento em cada plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart
                data={[
                  {
                    name: 'Google Ads',
                    value: metrics.googleAds.investment,
                  },
                  {
                    name: 'Meta Ads',
                    value: metrics.metaAds.investment,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top 5 Campanhas por ROAS */}
      {analyticsData && analyticsData.topCampaigns.length > 0 && (
        <div className="py-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Campanhas por ROAS</CardTitle>
              <CardDescription>
                Campanhas com melhor retorno sobre investimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={analyticsData.topCampaigns.slice(0, 5).map(c => ({
                  campanha: c.campaign_name.length > 30 
                    ? c.campaign_name.substring(0, 30) + '...' 
                    : c.campaign_name,
                  ROAS: c.roas,
                }))}
                dataKeys={[
                  { key: 'ROAS', name: 'ROAS', color: 'hsl(var(--primary))' },
                ]}
                xAxisKey="campanha"
                yAxisFormatter={(value: any) => `${Number(value).toFixed(2).replace('.', ',')}x`}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
