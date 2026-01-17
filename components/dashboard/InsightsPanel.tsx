'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import type { CampaignData, MarketingAnalyticsData } from '@/types/marketing'
import type { DashboardMetrics } from '@/types/dashboard'
import { useFilterContext } from '@/contexts/FilterContext'
import { hotelMatchesClient } from '@/lib/utils/hotel-mapping'

interface Insight {
  type: 'warning' | 'opportunity' | 'info'
  title: string
  description: string
  metric?: string
  client: string
  platform: 'Google Ads' | 'Meta Ads'
}

interface InsightsPanelProps {
  analyticsData: MarketingAnalyticsData
  dashboardMetrics: DashboardMetrics
}

export function InsightsPanel({ analyticsData, dashboardMetrics }: InsightsPanelProps) {
  const { selectedHotels } = useFilterContext()
  const [currentPage, setCurrentPage] = useState(0)

  const filteredCampaigns = useMemo(() => {
    if (!selectedHotels.length) return analyticsData.campaigns
    return analyticsData.campaigns.filter(campaign =>
      selectedHotels.some(hotel => hotelMatchesClient(hotel, campaign.client))
    )
  }, [analyticsData.campaigns, selectedHotels])

  const insights = useMemo(() => {
    const results: Insight[] = []
    const averageRoas = dashboardMetrics.geral.roas
    const normalizePlatform = (platform: CampaignData['platform']): Insight['platform'] => {
      if (platform.toLowerCase().includes('google')) return 'Google Ads'
      return 'Meta Ads'
    }

    const campaignsByClientPlatform = new Map<
      string,
      { client: string; platform: Insight['platform']; campaigns: CampaignData[] }
    >()

    const campaignsByClient = new Map<string, CampaignData[]>()

    filteredCampaigns.forEach(campaign => {
      const platform = normalizePlatform(campaign.platform)
      const key = `${campaign.client}__${platform}`
      const existing = campaignsByClientPlatform.get(key)
      if (existing) {
        existing.campaigns.push(campaign)
      } else {
        campaignsByClientPlatform.set(key, {
          client: campaign.client,
          platform,
          campaigns: [campaign],
        })
      }

      const clientCampaigns = campaignsByClient.get(campaign.client)
      if (clientCampaigns) {
        clientCampaigns.push(campaign)
      } else {
        campaignsByClient.set(campaign.client, [campaign])
      }
    })

    campaignsByClientPlatform.forEach(({ client, platform, campaigns }) => {
      const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
      const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0)
      const groupRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

      const campaignsWithDecline = campaigns.filter(
        campaign => campaign.roas > 0 && campaign.roas < averageRoas * 0.8
      )
      if (campaignsWithDecline.length > 0) {
        results.push({
          type: 'warning',
          title: 'Campanhas em Declínio',
          description: `${campaignsWithDecline.length} campanha(s) com ROAS abaixo da média. Considere revisar estratégia ou pausar.`,
          metric: `ROAS médio: ${averageRoas.toFixed(2)}`,
          client,
          platform,
        })
      }

      const scaleOpportunities = campaigns.filter(campaign => campaign.roas > 4.0 && campaign.spend < 1000)
      if (scaleOpportunities.length > 0) {
        const avgScaleRoas =
          scaleOpportunities.reduce((sum, c) => sum + c.roas, 0) / scaleOpportunities.length
        results.push({
          type: 'opportunity',
          title: 'Oportunidades de Escala',
          description: `${scaleOpportunities.length} campanha(s) com ROAS excelente e baixo investimento. Considere aumentar budget.`,
          metric: `ROAS médio: ${avgScaleRoas.toFixed(2)}`,
          client,
          platform,
        })
      }

      if (groupRoas < 2.0 && totalSpend > 0) {
        results.push({
          type: 'warning',
          title: 'Performance Abaixo do Esperado',
          description: 'ROAS abaixo de 2.0. Revise estratégias de campanha e segmentação.',
          metric: `ROAS atual: ${groupRoas.toFixed(2)}`,
          client,
          platform,
        })
      }

      if (groupRoas > 4.0 && totalSpend > 0) {
        results.push({
          type: 'opportunity',
          title: 'Excelente Performance',
          description: 'ROAS acima de 4.0. Considere aumentar investimento para escalar resultados.',
          metric: `ROAS atual: ${groupRoas.toFixed(2)}`,
          client,
          platform,
        })
      }

      const pausedCampaigns = campaigns.filter(
        campaign => campaign.campaign_status?.toUpperCase() === 'PAUSED' && campaign.roas > 3.0
      )
      if (pausedCampaigns.length > 0) {
        results.push({
          type: 'opportunity',
          title: 'Campanhas Pausadas com Potencial',
          description: `${pausedCampaigns.length} campanha(s) pausada(s) com ROAS histórico acima de 3.0. Considere reativar.`,
          client,
          platform,
        })
      }
    })

    campaignsByClient.forEach((campaigns, client) => {
      const googleSpend = campaigns
        .filter(campaign => normalizePlatform(campaign.platform) === 'Google Ads')
        .reduce((sum, c) => sum + (c.spend || 0), 0)
      const metaSpend = campaigns
        .filter(campaign => normalizePlatform(campaign.platform) === 'Meta Ads')
        .reduce((sum, c) => sum + (c.spend || 0), 0)
      const totalSpend = googleSpend + metaSpend
      if (totalSpend === 0) return

      const googleRatio = googleSpend / totalSpend
      if (googleRatio > 0.8) {
        results.push({
          type: 'info',
          title: 'Desequilíbrio de Investimento',
          description: 'Mais de 80% do investimento está no Google Ads. Considere diversificar para Meta Ads.',
          client,
          platform: 'Google Ads',
        })
      } else if (googleRatio < 0.2) {
        results.push({
          type: 'info',
          title: 'Desequilíbrio de Investimento',
          description: 'Mais de 80% do investimento está no Meta Ads. Considere diversificar para Google Ads.',
          client,
          platform: 'Meta Ads',
        })
      }
    })

    return results
  }, [dashboardMetrics.geral.roas, filteredCampaigns])

  const sortedInsights = useMemo(() => {
    const priority = { opportunity: 0, warning: 1, info: 2 }
    return [...insights].sort((a, b) => priority[a.type] - priority[b.type])
  }, [insights])

  const itemsPerPage = 3
  const totalPages = Math.ceil(sortedInsights.length / itemsPerPage)

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(0)
    }
  }, [currentPage, totalPages])

  const currentInsights = sortedInsights.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  )

  if (sortedInsights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights Automáticos
          </CardTitle>
          <CardDescription>
            Análise automática de performance e oportunidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum insight disponível no momento. Suas campanhas estão performando bem!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights Automáticos
          </CardTitle>
          <CardDescription>
            Análise automática de performance e oportunidades
          </CardDescription>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(page => Math.max(0, page - 1))}
              disabled={currentPage === 0}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{currentPage + 1}/{totalPages}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(page => Math.min(totalPages - 1, page + 1))}
              disabled={currentPage + 1 >= totalPages}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {currentInsights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                insight.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : insight.type === 'opportunity'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-base font-semibold text-foreground">{insight.client}</p>
                <Badge
                  variant="secondary"
                  className={
                    insight.platform === 'Google Ads'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }
                >
                  {insight.platform}
                </Badge>
              </div>
              <div className="flex items-start gap-3">
                {insight.type === 'warning' && (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                {insight.type === 'opportunity' && (
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                )}
                {insight.type === 'info' && (
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge
                      variant="secondary"
                      className={
                        insight.type === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : insight.type === 'opportunity'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {insight.type === 'warning'
                        ? 'Atenção'
                        : insight.type === 'opportunity'
                        ? 'Oportunidade'
                        : 'Info'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {insight.description}
                  </p>
                  {insight.metric && (
                    <p className="text-xs font-medium text-muted-foreground">
                      {insight.metric}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
