import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { Alert } from '@/types/alertas'
import { cn } from '@/lib/utils/cn'

interface AlertCardProps {
  alert: Alert
  onResolve?: (id: string) => void
}

export function AlertCard({ alert, onResolve }: AlertCardProps) {
  const getSeverityConfig = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          color: 'bg-red-50 border-red-200',
          badgeColor: 'bg-red-100 text-red-800',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          label: 'Crítico',
        }
      case 'warning':
        return {
          color: 'bg-yellow-50 border-yellow-200',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          label: 'Atenção',
        }
      case 'info':
        return {
          color: 'bg-green-50 border-green-200',
          badgeColor: 'bg-green-100 text-green-800',
          icon: <Info className="h-5 w-5 text-green-600" />,
          label: 'Oportunidade',
        }
      default:
        return {
          color: 'bg-gray-50 border-gray-200',
          badgeColor: 'bg-gray-100 text-gray-800',
          icon: <Info className="h-5 w-5 text-gray-600" />,
          label: 'Info',
        }
    }
  }

  const config = getSeverityConfig()

  return (
    <Card className={cn('border-2', config.color)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {config.icon}
            <div>
              <CardTitle className="text-lg">
                {alert.campaign_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {alert.client} • {alert.platform}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className={config.badgeColor}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">{alert.message}</p>
        </div>

        {alert.actions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Ações recomendadas:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              {alert.actions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        {onResolve && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(alert.id)}
            className="w-full"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar como resolvido
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          {formatDate(alert.created_at)}
        </p>
      </CardContent>
    </Card>
  )
}
