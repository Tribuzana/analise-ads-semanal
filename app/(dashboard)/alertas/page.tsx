'use client'

import { useAlertas } from '@/hooks/useAlertas'
import { AlertCard } from '@/components/alertas/AlertCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export default function AlertasPage() {
  const { alerts, loading, error, stats, resolveAlert } = useAlertas()
  const [severityFilter, setSeverityFilter] = useState<'critical' | 'warning' | 'info' | null>(null)

  const filteredAlerts = useMemo(() => {
    if (!severityFilter) return alerts
    return alerts.filter(a => a.severity === severityFilter)
  }, [alerts, severityFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Alertas</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Erro ao carregar alertas</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Alertas Inteligentes</h1>
        <p className="text-muted-foreground">
          Monitoramento automático de campanhas e oportunidades
        </p>
      </div>

      {/* Estatísticas */}
      <div className="py-6">
        <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:ring-2 hover:ring-red-500/50",
            severityFilter === 'critical' && "ring-2 ring-red-500 bg-red-50/10"
          )}
          onClick={() => setSeverityFilter(severityFilter === 'critical' ? null : 'critical')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:ring-2 hover:ring-yellow-500/50",
            severityFilter === 'warning' && "ring-2 ring-yellow-500 bg-yellow-50/10"
          )}
          onClick={() => setSeverityFilter(severityFilter === 'warning' ? null : 'warning')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warning}</div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/50",
            severityFilter === 'info' && "ring-2 ring-blue-500 bg-blue-50/10"
          )}
          onClick={() => setSeverityFilter(severityFilter === 'info' ? null : 'info')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <Info className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.info}</div>
          </CardContent>
        </Card>
        </div>

        {severityFilter && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSeverityFilter(null)}
              className="text-xs gap-2"
            >
              <X className="h-3 w-3" />
              Limpar filtro
            </Button>
          </div>
        )}
      </div>

      {/* Lista de Alertas */}
      <div className="py-6">
        {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {severityFilter ? `Nenhum alerta ${severityFilter === 'critical' ? 'crítico' : severityFilter === 'warning' ? 'de atenção' : 'de oportunidade'} encontrado` : 'Nenhum alerta no momento'}
            </p>
            <p className="text-sm text-muted-foreground">
              {severityFilter ? 'Tente limpar o filtro para ver todos os alertas.' : 'Suas campanhas estão performando bem!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAlerts
            .sort((a, b) => {
              const severityOrder = { critical: 0, warning: 1, info: 2 }
              return severityOrder[a.severity] - severityOrder[b.severity]
            })
            .map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResolve={resolveAlert}
              />
            ))}
        </div>
        )}
      </div>
    </div>
  )
}
