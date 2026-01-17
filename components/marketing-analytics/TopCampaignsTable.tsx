import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { CampaignData, SortField, SortDirection } from '@/types/marketing'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface TopCampaignsTableProps {
  campaigns: CampaignData[]
  onCampaignClick?: (campaign: CampaignData) => void
}

export function TopCampaignsTable({ campaigns, onCampaignClick }: TopCampaignsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const getPlatformColor = (platform: string) => {
    if (platform === 'Google Ads' || platform === 'Google') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedCampaigns = useMemo(() => {
    if (!sortField) {
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
        case 'platform':
          aValue = a.platform || ''
          bValue = b.platform || ''
          break
        case 'client':
          aValue = a.client || ''
          bValue = b.client || ''
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
  }, [campaigns, sortField, sortDirection])

  const totals = useMemo(() => {
    if (campaigns.length === 0) return null

    const t = campaigns.reduce(
      (acc, c) => ({
        spend: acc.spend + (c.spend || 0),
        revenue: acc.revenue + (c.revenue || 0),
        conversions: acc.conversions + (c.conversions || 0),
      }),
      { spend: 0, revenue: 0, conversions: 0 }
    )

    const roas = t.spend > 0 ? t.revenue / t.spend : 0
    const cpa = t.conversions > 0 ? t.spend / t.conversions : 0

    return {
      ...t,
      roas,
      cpa,
    }
  }, [campaigns])

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
        <TableCaption>Top 10 campanhas por ROAS</TableCaption>
        <TableHeader>
          <TableRow>
            <SortableHeaderLeft field="campaign_name">Campanha</SortableHeaderLeft>
            <SortableHeaderLeft field="platform">Plataforma</SortableHeaderLeft>
            <SortableHeaderLeft field="client">Cliente</SortableHeaderLeft>
            <SortableHeader field="spend" className="text-right">Investimento</SortableHeader>
            <SortableHeader field="revenue" className="text-right">Receita</SortableHeader>
            <SortableHeader field="roas" className="text-right">ROAS</SortableHeader>
            <SortableHeader field="conversions" className="text-right">Conversões</SortableHeader>
            <SortableHeader field="cpa" className="text-right">CPA</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCampaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Nenhuma campanha encontrada
              </TableCell>
            </TableRow>
          ) : (
            sortedCampaigns.map((campaign) => (
              <TableRow 
                key={`${campaign.campaign_id}_${campaign.platform}`}
                onClick={() => onCampaignClick?.(campaign)}
                className={cn(onCampaignClick ? "cursor-pointer" : "", "text-[13px]")}
              >
                <TableCell className="font-medium max-w-[300px] truncate">
                  {campaign.campaign_name || 'Sem nome'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn(getPlatformColor(campaign.platform), "text-[10px] px-1 py-0 h-5")}>
                    {campaign.platform === 'Google' ? 'Google Ads' : campaign.platform === 'Meta' ? 'Meta Ads' : campaign.platform}
                  </Badge>
                </TableCell>
                <TableCell>{campaign.client}</TableCell>
                <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                <TableCell className="text-right">{formatCurrency(campaign.revenue)}</TableCell>
                <TableCell className="text-right font-bold">{campaign.roas.toFixed(2)}</TableCell>
                <TableCell className="text-right">{formatNumber(campaign.conversions)}</TableCell>
                <TableCell className="text-right">{formatCurrency(campaign.cpa)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {totals && (
          <TableFooter>
            <TableRow className="hover:bg-transparent font-bold bg-muted/50 text-[13px]">
              <TableCell colSpan={3} className="px-2">Resumo Total</TableCell>
              <TableCell className="text-right px-2">{formatCurrency(totals.spend)}</TableCell>
              <TableCell className="text-right px-2">{formatCurrency(totals.revenue)}</TableCell>
              <TableCell className="text-right px-2">{totals.roas.toFixed(2)}</TableCell>
              <TableCell className="text-right px-2">{formatNumber(totals.conversions)}</TableCell>
              <TableCell className="text-right px-2">{formatCurrency(totals.cpa)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  )
}
