'use client'

import { useReservas } from '@/hooks/useReservas'
import { useFilterContext } from '@/contexts/FilterContext'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart } from '@/components/charts/LineChart'
import { PieChart } from '@/components/charts/PieChart'
import { BarChart } from '@/components/charts/BarChart'
import { formatNumber } from '@/lib/utils/format'
import { calculateDelta } from '@/lib/utils/calculations'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

export default function ReservasPage() {
  const { data, loading, error } = useReservas()
  const { compareYearAgo } = useFilterContext()

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

  const compareLabel = compareYearAgo ? 'vs ano anterior' : 'vs período anterior'
  const totalBuscasDelta = calculateDelta(data.totalBuscas, data.totalBuscasAnterior)
  const antecedenciaDelta = calculateDelta(data.antecedenciaMedia, data.antecedenciaMediaAnterior)
  const duracaoDelta = calculateDelta(data.duracaoMedia, data.duracaoMediaAnterior)

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
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Buscas últimos 7 dias"
            value={formatNumber(data.totalBuscas)}
            icon={<Calendar className="h-4 w-4" />}
            change={totalBuscasDelta}
            compareValue={formatNumber(data.totalBuscasAnterior)}
            compareLabel={compareLabel}
          />
          <MetricCard
            title="Antecedência média"
            value={`${formatNumber(data.antecedenciaMedia, 1)} dias`}
            icon={<TrendingUp className="h-4 w-4" />}
            change={antecedenciaDelta}
            compareValue={`${formatNumber(data.antecedenciaMediaAnterior, 1)} dias`}
            compareLabel={compareLabel}
          />
          <MetricCard
            title="Duração média"
            value={`${formatNumber(data.duracaoMedia, 1)} dias`}
            icon={<Clock className="h-4 w-4" />}
            change={duracaoDelta}
            compareValue={`${formatNumber(data.duracaoMediaAnterior, 1)} dias`}
            compareLabel={compareLabel}
          />
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
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Antecedência</CardTitle>
              <CardDescription>Percentual de buscas por faixas de antecedência</CardDescription>
            </CardHeader>
            <CardContent>
              {data.distribuicaoAntecedencia.length > 0 ? (
                <BarChart
                  data={data.distribuicaoAntecedencia.map(item => ({
                    faixa: item.faixa,
                    count: item.count,
                  }))}
                  dataKeys={[
                    { key: 'count', name: 'Buscas', color: 'hsl(var(--primary))' },
                  ]}
                  xAxisKey="faixa"
                  yAxisFormatter={(value: any) => formatNumber(value)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem dados de antecedência para o período selecionado.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Duração</CardTitle>
              <CardDescription>Proporção de buscas por duração média</CardDescription>
            </CardHeader>
            <CardContent>
              {data.distribuicaoDuracao.length > 0 ? (
                <PieChart
                  data={data.distribuicaoDuracao.map(item => ({
                    name: item.faixa,
                    value: item.count,
                  }))}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem dados de duração no intervalo atual.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
