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
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { CampaignData, SortField, SortDirection } from '@/types/marketing'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface CampaignsTableProps {
  campaigns: CampaignData[]
  onCampaignClick?: (campaign: CampaignData) => void
}

export function CampaignsTable({ campaigns, onCampaignClick }: CampaignsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    const s = status.toUpperCase()
    if (s === 'ENABLED' || s === 'ACTIVE') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (s === 'PAUSED') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Alternar direção se o mesmo campo
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Novo campo, começar com desc
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedCampaigns = useMemo(() => {
    if (!sortField) {
      // Ordenação padrão por ROAS (maior primeiro)
      return [...campaigns].sort((a, b) => b.roas - a.roas)
    }

    const sorted = [...campaigns].sort((a, b) => {
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
        case 'clicks':
          aValue = a.clicks
          bValue = b.clicks
          break
        case 'ctr':
          aValue = a.ctr
          bValue = b.ctr
          break
        case 'cpc':
          aValue = a.cpc
          bValue = b.cpc
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
  }, [campaigns, sortField, sortDirection])

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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeaderLeft field="campaign_name">Campanha</SortableHeaderLeft>
            <TableHead>Status</TableHead>
            <SortableHeaderLeft field="campaign_objective">Objetivo</SortableHeaderLeft>
            <SortableHeader field="spend" className="text-right">Investimento</SortableHeader>
            <SortableHeader field="revenue" className="text-right">Receita</SortableHeader>
            <SortableHeader field="roas" className="text-right">ROAS</SortableHeader>
            <SortableHeader field="conversions" className="text-right">Conversões</SortableHeader>
            <SortableHeader field="cpa" className="text-right">CPA</SortableHeader>
            <SortableHeader field="clicks" className="text-right">Cliques</SortableHeader>
            <SortableHeader field="ctr" className="text-right">CTR</SortableHeader>
            <SortableHeader field="cpc" className="text-right">CPC</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCampaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">
                Nenhuma campanha encontrada
              </TableCell>
            </TableRow>
          ) : (
            sortedCampaigns.map((campaign) => (
              <TableRow 
                key={campaign.campaign_id}
                onClick={() => onCampaignClick?.(campaign)}
                className={onCampaignClick ? "cursor-pointer" : ""}
              >
                <TableCell className="font-medium max-w-[300px] truncate" title={campaign.campaign_name || ''}>
                  {campaign.campaign_name || 'Sem nome'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusColor(campaign.campaign_status)}>
                    {campaign.campaign_status || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={campaign.campaign_objective || ''}>
                  {campaign.campaign_objective || 'N/A'}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                <TableCell className="text-right">{formatCurrency(campaign.revenue)}</TableCell>
                <TableCell className="text-right font-bold">{campaign.roas.toFixed(2)}</TableCell>
                <TableCell className="text-right">{formatNumber(campaign.conversions)}</TableCell>
                <TableCell className="text-right">{formatCurrency(campaign.cpa)}</TableCell>
                <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                <TableCell className="text-right">{formatPercentage(campaign.ctr)}</TableCell>
                <TableCell className="text-right">{formatCurrency(campaign.cpc)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
