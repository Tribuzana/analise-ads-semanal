'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { CampaignData, SortField, SortDirection, CampaignWithVariation, CampaignVariation } from '@/types/marketing'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface CampaignsComparisonTableProps {
  campaigns: CampaignData[]
  previousCampaigns: CampaignData[]
  onCampaignClick?: (campaign: CampaignData) => void
}

function calculateCampaignVariations(
  current: CampaignData,
  previous: CampaignData | undefined
): CampaignVariation {
  if (!previous) {
    return {
      spend: 0,
      revenue: 0,
      conversions: 0,
      cpa: 0,
      roas: 0,
    }
  }

  const calculateDelta = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    spend: calculateDelta(current.spend, previous.spend),
    revenue: calculateDelta(current.revenue, previous.revenue),
    conversions: calculateDelta(current.conversions, previous.conversions),
    cpa: calculateDelta(current.cpa, previous.cpa),
    roas: calculateDelta(current.roas, previous.roas),
  }
}

export function CampaignsComparisonTable({
  campaigns,
  previousCampaigns,
  onCampaignClick,
}: CampaignsComparisonTableProps) {
  const [onlyActive, setOnlyActive] = useState(true)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Criar mapa de campanhas anteriores para lookup rápido
  const previousCampaignsMap = useMemo(() => {
    const map = new Map<string, CampaignData>()
    previousCampaigns.forEach(campaign => {
      const key = `${campaign.campaign_id}_${campaign.platform}`
      map.set(key, campaign)
    })
    return map
  }, [previousCampaigns])

  // Calcular variações e criar campanhas com variações
  const campaignsWithVariations = useMemo(() => {
    return campaigns.map(campaign => {
      const key = `${campaign.campaign_id}_${campaign.platform}`
      const previous = previousCampaignsMap.get(key)
      const variation = calculateCampaignVariations(campaign, previous)
      
      return {
        ...campaign,
        variation,
      } as CampaignWithVariation
    })
  }, [campaigns, previousCampaignsMap])

  // Filtrar por status se "Apenas ativas" estiver ativo
  const filteredCampaigns = useMemo(() => {
    if (!onlyActive) return campaignsWithVariations
    
    return campaignsWithVariations.filter(campaign => {
      if (!campaign.campaign_status) return false
      const status = campaign.campaign_status.toUpperCase()
      return status === 'ACTIVE' || status === 'ENABLED'
    })
  }, [campaignsWithVariations, onlyActive])

  // Ordenar campanhas
  const sortedCampaigns = useMemo(() => {
    if (!sortField) {
      // Ordenação padrão por ROAS (maior primeiro)
      return [...filteredCampaigns].sort((a, b) => b.roas - a.roas)
    }

    const sorted = [...filteredCampaigns].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortField) {
        case 'campaign_name':
          aValue = a.campaign_name || ''
          bValue = b.campaign_name || ''
          break
        case 'campaign_objective':
          aValue = a.campaign_objective || ''
          bValue = b.campaign_objective || ''
          break
        case 'spend':
          aValue = a.spend
          bValue = b.spend
          break
        case 'revenue':
          aValue = a.revenue
          bValue = b.revenue
          break
        case 'roas':
          aValue = a.roas
          bValue = b.roas
          break
        case 'conversions':
          aValue = a.conversions
          bValue = b.conversions
          break
        case 'cpa':
          aValue = a.cpa
          bValue = b.cpa
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })

    return sorted
  }, [filteredCampaigns, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const SortableHeader = ({ field, children, className }: { field: SortField, children: React.ReactNode, className?: string }) => (
    <TableHead 
      className={cn(
        "cursor-pointer hover:bg-muted select-none",
        sortField === field && "font-bold",
        className
      )}
      onClick={() => handleSort(field)}
      aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className="flex items-center justify-end">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  )

  const SortableHeaderLeft = ({ field, children, className }: { field: SortField, children: React.ReactNode, className?: string }) => (
    <TableHead 
      className={cn(
        "cursor-pointer hover:bg-muted select-none",
        sortField === field && "font-bold",
        className
      )}
      onClick={() => handleSort(field)}
      aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className="flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  )

  const VariationBadge = ({ value }: { value: number }) => {
    if (value === 0 || isNaN(value)) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          <span className="text-xs">-</span>
        </Badge>
      )
    }

    const isPositive = value > 0
    const colorClass = isPositive
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'

    return (
      <Badge variant="secondary" className={cn('gap-1', colorClass)}>
        {isPositive ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        <span className="text-xs">{Math.abs(value).toFixed(1)}%</span>
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com título e toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Campanhas e variação vs período anterior</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="only-active" className="text-sm cursor-pointer">
            Apenas ativas
          </Label>
          <Switch
            id="only-active"
            checked={onlyActive}
            onCheckedChange={setOnlyActive}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeaderLeft field="campaign_name">Campanha</SortableHeaderLeft>
              <SortableHeaderLeft field="campaign_objective">Objetivo</SortableHeaderLeft>
              <TableHead className="text-right">Investimento</TableHead>
              <TableHead className="text-right">% Inv.</TableHead>
              <SortableHeader field="conversions" className="text-right">Resultados</SortableHeader>
              <TableHead className="text-right">% Ações</TableHead>
              <SortableHeader field="cpa" className="text-right">CPA</SortableHeader>
              <TableHead className="text-right">% CPA</TableHead>
              <SortableHeader field="revenue" className="text-right">Receita</SortableHeader>
              <TableHead className="text-right">% Receita</TableHead>
              <SortableHeader field="roas" className="text-right">ROAS</SortableHeader>
              <TableHead className="text-right">% ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  Nenhuma campanha encontrada
                </TableCell>
              </TableRow>
            ) : (
              sortedCampaigns.map((campaign) => (
                <TableRow 
                  key={`${campaign.campaign_id}_${campaign.platform}`}
                  onClick={() => onCampaignClick?.(campaign)}
                  className={onCampaignClick ? "cursor-pointer" : ""}
                >
                  <TableCell className="font-medium max-w-[300px] truncate" title={campaign.campaign_name || ''}>
                    {campaign.campaign_name || 'Sem nome'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={campaign.campaign_objective || ''}>
                    {campaign.campaign_objective || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                  <TableCell className="text-right">
                    {campaign.variation && <VariationBadge value={campaign.variation.spend} />}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(campaign.conversions)}</TableCell>
                  <TableCell className="text-right">
                    {campaign.variation && <VariationBadge value={campaign.variation.conversions} />}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(campaign.cpa)}</TableCell>
                  <TableCell className="text-right">
                    {campaign.variation && <VariationBadge value={campaign.variation.cpa} />}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(campaign.revenue)}</TableCell>
                  <TableCell className="text-right">
                    {campaign.variation && <VariationBadge value={campaign.variation.revenue} />}
                  </TableCell>
                  <TableCell className="text-right font-bold">{campaign.roas.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {campaign.variation && <VariationBadge value={campaign.variation.roas} />}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
