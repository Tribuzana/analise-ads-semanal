'use client'

import { useReservas } from '@/hooks/useReservas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart } from '@/components/charts/LineChart'
import { PieChart } from '@/components/charts/PieChart'
import { BarChart } from '@/components/charts/BarChart'
import { formatNumber } from '@/lib/utils/format'
import { Calendar, Smartphone, Monitor, Tablet, TrendingUp } from 'lucide-react'

export default function ReservasPage() {
  const { data, loading, error } = useReservas()

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Análise de Reservas</h1>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Erro ao carregar dados</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-10 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Análise de Reservas</h1>
        <p className="text-muted-foreground">
          Análise de buscas e padrões de reservas
        </p>
      </div>

      {/* Métricas principais */}
      <div className="py-6">
        <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Buscas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalBuscas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Antecedência Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.antecedenciaMedia, 1)} dias</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.duracaoMedia, 1)} dias</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buscas por Dia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalBuscas > 0 && data.porDia.length > 0
                ? formatNumber(data.totalBuscas / data.porDia.length, 0)
                : 0}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Gráficos */}
      {data.porDia.length > 0 && (
        <div className="py-6">
          <Card>
          <CardHeader>
            <CardTitle>Buscas ao Longo do Tempo</CardTitle>
            <CardDescription>
              Volume de buscas por dia no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              data={data.porDia.map(d => ({
                date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                Buscas: d.count,
              }))}
              dataKeys={[
                { key: 'Buscas', name: 'Buscas', color: 'hsl(var(--primary))' },
              ]}
            />
          </CardContent>
        </Card>
        </div>
      )}

      <div className="py-6">
        <div className="grid gap-4 md:grid-cols-2">
        {data.porDispositivo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Buscas por Dispositivo</CardTitle>
              <CardDescription>
                Distribuição de buscas por tipo de dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart
                data={data.porDispositivo.map(d => ({
                  name: d.dispositivo === 'mobile' ? 'Mobile' : 
                        d.dispositivo === 'desktop' ? 'Desktop' :
                        d.dispositivo === 'tablet' ? 'Tablet' : d.dispositivo,
                  value: d.count,
                }))}
              />
            </CardContent>
          </Card>
        )}

        {data.porDispositivo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Dispositivos</CardTitle>
              <CardDescription>
                Dispositivos mais utilizados para buscas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={data.porDispositivo.slice(0, 5).map(d => ({
                  dispositivo: d.dispositivo === 'mobile' ? 'Mobile' : 
                               d.dispositivo === 'desktop' ? 'Desktop' :
                               d.dispositivo === 'tablet' ? 'Tablet' : d.dispositivo,
                  count: d.count,
                }))}
                dataKeys={[
                  { key: 'count', name: 'Buscas', color: 'hsl(var(--primary))' },
                ]}
                xAxisKey="dispositivo"
              />
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}
