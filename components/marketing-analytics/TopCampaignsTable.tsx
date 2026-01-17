import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import type { CampaignData } from '@/types/marketing'

interface TopCampaignsTableProps {
  campaigns: CampaignData[]
}

export function TopCampaignsTable({ campaigns }: TopCampaignsTableProps) {
  const getPlatformColor = (platform: string) => {
    if (platform === 'Google Ads' || platform === 'Google') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>Top 10 campanhas por ROAS</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Campanha</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Investimento</TableHead>
            <TableHead className="text-right">Receita</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
            <TableHead className="text-right">Conversões</TableHead>
            <TableHead className="text-right">CPA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Nenhuma campanha encontrada
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={`${campaign.campaign_id}_${campaign.platform}`}>
                <TableCell className="font-medium max-w-[300px] truncate">
                  {campaign.campaign_name || 'Sem nome'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getPlatformColor(campaign.platform)}>
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
      </Table>
    </div>
  )
}
