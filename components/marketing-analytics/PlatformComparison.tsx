'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import type { CampaignData } from '@/types/marketing'

interface PlatformComparisonProps {
  campaigns: CampaignData[]
}

export function PlatformComparison({ campaigns }: PlatformComparisonProps) {
  const google = campaigns.filter(c => c.platform === 'Google Ads' || c.platform === 'Google')
  const meta = campaigns.filter(c => c.platform === 'Meta Ads' || c.platform === 'Meta')

  const googleSpend = google.reduce((sum, c) => sum + c.spend, 0)
  const metaSpend = meta.reduce((sum, c) => sum + c.spend, 0)
  const googleRevenue = google.reduce((sum, c) => sum + c.revenue, 0)
  const metaRevenue = meta.reduce((sum, c) => sum + c.revenue, 0)
  const googleConversions = google.reduce((sum, c) => sum + c.conversions, 0)
  const metaConversions = meta.reduce((sum, c) => sum + c.conversions, 0)

  const googleROAS = googleSpend > 0 ? googleRevenue / googleSpend : 0
  const metaROAS = metaSpend > 0 ? metaRevenue / metaSpend : 0

  const total = googleSpend + metaSpend

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação entre Plataformas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Ads */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Google Ads</span>
            <span className="text-sm text-muted-foreground">
              {google.length} campanhas
            </span>
          </div>
          <div className="h-4 w-full rounded-full bg-secondary/20">
            <div
              className="h-4 rounded-full bg-blue-500"
              style={{ width: `${total > 0 ? (googleSpend / total) * 100 : 0}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Investimento</p>
              <p className="font-semibold">{formatCurrency(googleSpend)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Receita</p>
              <p className="font-semibold">{formatCurrency(googleRevenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ROAS</p>
              <p className="font-semibold">{googleROAS.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Conversões</p>
              <p className="font-semibold">{formatNumber(googleConversions)}</p>
            </div>
          </div>
        </div>

        {/* Meta Ads */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Meta Ads</span>
            <span className="text-sm text-muted-foreground">
              {meta.length} campanhas
            </span>
          </div>
          <div className="h-4 w-full rounded-full bg-secondary/20">
            <div
              className="h-4 rounded-full bg-purple-500"
              style={{ width: `${total > 0 ? (metaSpend / total) * 100 : 0}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Investimento</p>
              <p className="font-semibold">{formatCurrency(metaSpend)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Receita</p>
              <p className="font-semibold">{formatCurrency(metaRevenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ROAS</p>
              <p className="font-semibold">{metaROAS.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Conversões</p>
              <p className="font-semibold">{formatNumber(metaConversions)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
