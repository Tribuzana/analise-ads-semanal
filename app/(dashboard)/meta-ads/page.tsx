'use client'

import { useState, useMemo } from 'react'
import { useMetaAds } from '@/hooks/useMetaAds'
import { useFilterContext } from '@/contexts/FilterContext'
import { MetaAdsMetrics } from '@/components/meta-ads/MetaAdsMetrics'
import { CampaignsTable } from '@/components/google-ads/CampaignsTable'
import { CampaignsComparisonTable } from '@/components/campaigns/CampaignsComparisonTable'
import { CampaignDetailsModal } from '@/components/campaigns/CampaignDetailsModal'
import { CampaignStatusFilterComponent } from '@/components/campaigns/CampaignStatusFilter'
import { ObjectiveAnalysisChart } from '@/components/marketing-analytics/ObjectiveAnalysisChart'
import { Skeleton } from '@/components/ui/skeleton'
import { Facebook } from 'lucide-react'
import { getCampaignPeriodMetrics } from '@/lib/actions/marketing-analytics/get-analytics'
import type { CampaignData, CampaignStatusFilter, CampaignPeriodMetrics } from '@/types/marketing'

export default function MetaAdsPage() {
  const { data, loading, error } = useMetaAds()
  const filters = useFilterContext()
  const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>('active')
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null)
  const [periodMetrics, setPeriodMetrics] = useState<CampaignPeriodMetrics | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  // Filtrar campanhas por status
  const filteredCampaigns = useMemo(() => {
    if (!data?.campaigns) return []

    if (statusFilter === 'all') {
      return data.campaigns
    }

    const statusMap: Record<string, string[]> = {
      active: ['ACTIVE', 'ENABLED'],
      paused: ['PAUSED'],
    }

    const allowedStatuses = statusMap[statusFilter] || []
    
    return data.campaigns.filter(campaign => {
      if (!campaign.campaign_status) return false
      const normalizedStatus = campaign.campaign_status.toUpperCase()
      return allowedStatuses.includes(normalizedStatus)
    })
  }, [data?.campaigns, statusFilter])

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
        <div className="flex items-center gap-3">
          <Facebook className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Meta Ads</h1>
            <p className="text-muted-foreground">
              Análise detalhada das campanhas do Facebook e Instagram
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[140px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
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
      <div className="flex items-center gap-3">
        <Facebook className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Meta Ads</h1>
          <p className="text-muted-foreground">
            Análise detalhada das campanhas do Facebook e Instagram
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="py-6">
        <MetaAdsMetrics 
          campaigns={data.campaigns} 
          comparisonCampaigns={data.comparison?.campaigns}
        />
      </div>

      {/* Análise por Objetivo */}
      {data.objectiveAnalysis.length > 0 && (
        <div className="py-6">
          <h2 className="text-xl font-semibold mb-6">Análise por Objetivo</h2>
          <ObjectiveAnalysisChart data={data.objectiveAnalysis} />
        </div>
      )}

      {/* Tabela de Campanhas com Variação */}
      <div className="py-6">
        <CampaignsComparisonTable
          campaigns={data.campaigns}
          previousCampaigns={data.comparison?.campaigns || []}
          onCampaignClick={handleCampaignClick}
        />
      </div>

      {/* Tabela de Campanhas */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Todas as Campanhas</h2>
          <CampaignStatusFilterComponent 
            value={statusFilter} 
            onValueChange={setStatusFilter} 
          />
        </div>
        <CampaignsTable 
          campaigns={filteredCampaigns} 
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
