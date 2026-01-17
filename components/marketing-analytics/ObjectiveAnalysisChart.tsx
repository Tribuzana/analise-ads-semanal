'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import type { ObjectiveAnalysis } from '@/types/marketing'

interface ObjectiveAnalysisChartProps {
  data: ObjectiveAnalysis[]
}

export function ObjectiveAnalysisChart({ data }: ObjectiveAnalysisChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise por Objetivo de Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  const maxSpend = Math.max(...data.map(d => d.spend), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise por Objetivo de Campanha</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.objective} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.objective}</span>
                <div className="flex gap-4 text-muted-foreground">
                  <span>{item.campaigns} campanhas</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(item.spend)}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary/20">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(item.spend / maxSpend) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>ROAS: {item.roas.toFixed(2)}</span>
                <span>Receita: {formatCurrency(item.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
