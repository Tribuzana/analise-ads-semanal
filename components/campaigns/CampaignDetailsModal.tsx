'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'
import type { CampaignData, CampaignPeriodMetrics } from '@/types/marketing'

interface CampaignDetailsModalProps {
  campaign: CampaignData | null
  periodMetrics: CampaignPeriodMetrics | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CampaignDetailsModal({
  campaign,
  periodMetrics,
  open,
  onOpenChange,
}: CampaignDetailsModalProps) {
  if (!campaign) return null

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    const s = status.toUpperCase()
    if (s === 'ENABLED' || s === 'ACTIVE') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (s === 'PAUSED') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const getPlatformColor = (platform: string) => {
    if (platform === 'Google Ads' || platform === 'Google') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
    if (platform === 'Meta Ads' || platform === 'Meta') {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  const platformLabel = campaign.platform === 'Google' ? 'Google Ads' : campaign.platform === 'Meta' ? 'Meta Ads' : campaign.platform

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{campaign.campaign_name || 'Sem nome'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Detalhes da Campanha */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Detalhes da Campanha</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plataforma</p>
                <Badge variant="secondary" className={getPlatformColor(campaign.platform)}>
                  {platformLabel}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                <p className="font-medium">{campaign.client || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Objetivo</p>
                <p className="font-medium">{campaign.campaign_objective || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estratégia</p>
                <p className="font-medium">{campaign.campaign_bidding_strategy_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant="secondary" className={getStatusColor(campaign.campaign_status)}>
                  {campaign.campaign_status || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Métricas Gerais */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Métricas Gerais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Investimento Total</p>
                <p className="text-lg font-semibold">{formatCurrency(campaign.spend)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
                <p className="text-lg font-semibold">{formatCurrency(campaign.revenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resultados</p>
                <p className="text-lg font-semibold">{formatNumber(campaign.conversions)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">ROAS</p>
                <p className="text-lg font-semibold">{campaign.roas.toFixed(2)}x</p>
              </div>
              
              {/* Métricas do Período */}
              {periodMetrics && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Investimento (Período)</p>
                    <p className="text-lg font-semibold">{formatCurrency(periodMetrics.spend)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receita (Período)</p>
                    <p className="text-lg font-semibold">{formatCurrency(periodMetrics.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ROAS (Período)</p>
                    <p className="text-lg font-semibold">{periodMetrics.roas.toFixed(2)}x</p>
                  </div>
                </>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Cliques</p>
                <p className="text-lg font-semibold">{formatNumber(campaign.clicks)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Impressões</p>
                <p className="text-lg font-semibold">{formatNumber(campaign.impressions)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">CPA</p>
                <p className="text-lg font-semibold">{formatCurrency(campaign.cpa)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">CPC</p>
                <p className="text-lg font-semibold">{formatCurrency(campaign.cpc)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">CTR</p>
                <p className="text-lg font-semibold">{formatPercentage(campaign.ctr)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
