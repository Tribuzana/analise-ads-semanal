import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  subtitle?: string
  icon?: React.ReactNode
  compareValue?: string | number // Valor do período anterior (YoY)
  compareLabel?: string // Label para o valor de comparação (ex: "vs ano anterior")
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  subtitle, 
  icon,
  compareValue,
  compareLabel = 'vs ano anterior'
}: MetricCardProps) {
  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'bg-gray-100 text-gray-800'
    return change > 0
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const getChangeIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />
    return change > 0
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {compareValue !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            {compareLabel}: {compareValue}
          </p>
        )}
        {subtitle && !compareValue && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {change !== undefined && (
          <Badge
            variant="secondary"
            className={cn('mt-2 gap-1', getChangeColor())}
          >
            {getChangeIcon()}
            {Math.abs(change).toFixed(1)}%
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
