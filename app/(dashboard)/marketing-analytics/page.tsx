'use client'

import { useState } from 'react'
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics'
import { useFilterContext } from '@/contexts/FilterContext'
import { KPISection } from '@/components/marketing-analytics/KPISection'
import { TopCampaignsTable } from '@/components/marketing-analytics/TopCampaignsTable'
import { CampaignsComparisonTable } from '@/components/campaigns/CampaignsComparisonTable'
import { ObjectiveAnalysisChart } from '@/components/marketing-analytics/ObjectiveAnalysisChart'
import { PlatformComparison } from '@/components/marketing-analytics/PlatformComparison'
import { CampaignDetailsModal } from '@/components/campaigns/CampaignDetailsModal'
import { BalanceAlertCard } from '@/components/alertas/BalanceAlertCard'
import { GoogleAdsAlertCard } from '@/components/alertas/GoogleAdsAlertCard'
import { Skeleton } from '@/components/ui/skeleton'
import { getCampaignPeriodMetrics } from '@/lib/actions/marketing-analytics/get-analytics'
import type { CampaignData, CampaignPeriodMetrics } from '@/types/marketing'

export default function MarketingAnalyticsPage() {
  const { data, loading, error } = useMarketingAnalytics()
  const filters = useFilterContext()
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null)
  const [periodMetrics, setPeriodMetrics] = useState<CampaignPeriodMetrics | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  const handleCampaignClick = async (campaign: CampaignData) => {
    setSelectedCampaign(campaign)
    setModalOpen(true)
    setLoadingMetrics(true)

    try {
      const metrics = await getCampaignPeriodMetrics(
        campaign.campaign_id,
        campaign.platform,
        {
          selectedHotels: filters.selectedHotels,
          startDate: filters.startDate,
          endDate: filters.endDate,
          selectedCidades: filters.selectedCidades,
          selectedEstados: filters.selectedEstados,
          compareYearAgo: filters.compareYearAgo,
          selectedObjectives: filters.selectedObjectives,
          selectedResultTypes: filters.selectedResultTypes,
        }
      )
      setPeriodMetrics(metrics)
    } catch (err) {
      console.error('Erro ao buscar métricas do período:', err)
      setPeriodMetrics(null)
    } finally {
      setLoadingMetrics(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Marketing Analytics</h1>
          <p className="text-muted-foreground">
            Análise consolidada de todas as plataformas de anúncios
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-[140px]" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
        <Skeleton className="h-[400px]" />
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
              <li>Se você está autenticado</li>
              <li>Se as datas dos filtros estão definidas</li>
              <li>O console do navegador para mais detalhes</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-10 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Marketing Analytics</h1>
        <p className="text-muted-foreground">
          Análise consolidada de todas as plataformas de anúncios
        </p>
      </div>

      {/* Alertas de Saldo */}
      <div id="insights-automaticos" className="grid gap-6 md:grid-cols-2">
        <BalanceAlertCard />
        <GoogleAdsAlertCard />
      </div>

      {/* KPIs */}
      <div className="py-6">
        <KPISection data={data} />
      </div>

      {/* Análises */}
      <div className="py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <ObjectiveAnalysisChart data={data.objectiveAnalysis} />
          <PlatformComparison campaigns={data.campaigns} />
        </div>
      </div>

      {/* Top Campanhas */}
      <div className="py-6">
        <h2 className="text-xl font-semibold mb-6">Top Campanhas</h2>
        <TopCampaignsTable 
          campaigns={data.topCampaigns} 
          onCampaignClick={handleCampaignClick}
        />
      </div>

      {/* Tabela de Campanhas com Variação */}
      <div className="py-6">
        <CampaignsComparisonTable
          campaigns={data.campaigns}
          previousCampaigns={data.comparison?.campaigns || []}
          onCampaignClick={handleCampaignClick}
        />
      </div>

      {/* Modal de Detalhes */}
      <CampaignDetailsModal
        campaign={selectedCampaign}
        periodMetrics={periodMetrics}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
