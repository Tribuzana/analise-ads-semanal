'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import type { MarketingAnalyticsData } from '@/types/marketing'
import type { DashboardMetrics } from '@/types/dashboard'
import { formatCurrency } from '@/lib/utils/format'

interface Insight {
  type: 'warning' | 'opportunity' | 'info'
  title: string
  description: string
  metric?: string
}

interface InsightsPanelProps {
  analyticsData: MarketingAnalyticsData
  dashboardMetrics: DashboardMetrics
}

export function InsightsPanel({ analyticsData, dashboardMetrics }: InsightsPanelProps) {
  const insights: Insight[] = []

  // 1. Campanhas em declínio (ROAS caiu > 20%)
  const campaignsWithDecline = analyticsData.campaigns.filter(campaign => {
    // Comparar com média geral
    const avgROAS = dashboardMetrics.geral.roas
    return campaign.roas > 0 && campaign.roas < avgROAS * 0.8
  })

  if (campaignsWithDecline.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Campanhas em Declínio',
      description: `${campaignsWithDecline.length} campanha(s) com ROAS abaixo da média. Considere revisar estratégia ou pausar.`,
      metric: `ROAS médio: ${dashboardMetrics.geral.roas.toFixed(2)}`,
    })
  }

  // 2. Oportunidades de escala (Alto ROAS + baixo budget)
  const scaleOpportunities = analyticsData.campaigns.filter(campaign => {
    // Assumindo que temos acesso ao budget diário (precisaria vir dos dados)
    return campaign.roas > 4.0 && campaign.spend < 1000
  })

  if (scaleOpportunities.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Oportunidades de Escala',
      description: `${scaleOpportunities.length} campanha(s) com ROAS excelente e baixo investimento. Considere aumentar budget.`,
      metric: `ROAS médio: ${(scaleOpportunities.reduce((sum, c) => sum + c.roas, 0) / scaleOpportunities.length).toFixed(2)}`,
    })
  }

  // 3. Baixa performance geral
  if (dashboardMetrics.geral.roas < 2.0 && dashboardMetrics.geral.investment > 0) {
    insights.push({
      type: 'warning',
      title: 'Performance Abaixo do Esperado',
      description: 'ROAS geral está abaixo de 2.0. Revise estratégias de campanha e segmentação.',
      metric: `ROAS atual: ${dashboardMetrics.geral.roas.toFixed(2)}`,
    })
  }

  // 4. Alta performance
  if (dashboardMetrics.geral.roas > 4.0 && dashboardMetrics.geral.investment > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Excelente Performance',
      description: 'ROAS geral está acima de 4.0. Considere aumentar investimento para escalar resultados.',
      metric: `ROAS atual: ${dashboardMetrics.geral.roas.toFixed(2)}`,
    })
  }

  // 5. Desequilíbrio entre plataformas
  const googleRatio = dashboardMetrics.googleAds.investment / (dashboardMetrics.geral.investment || 1)
  if (googleRatio > 0.8) {
    insights.push({
      type: 'info',
      title: 'Desequilíbrio de Investimento',
      description: 'Mais de 80% do investimento está no Google Ads. Considere diversificar para Meta Ads.',
    })
  } else if (googleRatio < 0.2) {
    insights.push({
      type: 'info',
      title: 'Desequilíbrio de Investimento',
      description: 'Mais de 80% do investimento está no Meta Ads. Considere diversificar para Google Ads.',
    })
  }

  // 6. Campanhas pausadas com potencial
  const pausedCampaigns = analyticsData.campaigns.filter(
    c => c.campaign_status?.toUpperCase() === 'PAUSED' && c.roas > 3.0
  )

  if (pausedCampaigns.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Campanhas Pausadas com Potencial',
      description: `${pausedCampaigns.length} campanha(s) pausada(s) com ROAS histórico acima de 3.0. Considere reativar.`,
    })
  }

  if (insights.length === 0) {
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Insights Automáticos
        </CardTitle>
        <CardDescription>
          Análise automática de performance e oportunidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
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
      </CardContent>
    </Card>
  )
}
