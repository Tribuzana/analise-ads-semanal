'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/format'

interface SparklineCardProps {
  label: string              // Título do card (ex: "Total Revenue")
  value: string | number     // Valor principal formatado (ex: "R$ 78.989,83")
  delta: number             // Percentual de mudança (ex: 12 para +12%)
  isPositive: boolean       // true = verde (crescimento), false = vermelho (declínio)
  data: number[]           // Array de números para o sparkline
  valueType?: 'currency' | 'number' | 'decimal' // Tipo de formatação para o tooltip
  dates?: string[]          // Array opcional de datas correspondentes aos dados
  compareValue?: string | number // Valor do período anterior (YoY)
  compareLabel?: string    // Label para o valor de comparação (ex: "vs ano anterior")
}

/**
 * Gera o path SVG para o sparkline com curvas suaves
 */
function generateSparklinePath(data: number[], width: number, height: number): string {
  if (!data || !Array.isArray(data) || data.length === 0) return ''
  if (data.length === 1) {
    const y = height / 2
    return `M 0 ${y} L ${width} ${y}`
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1 // Evita divisão por zero

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * width
    const y = height - ((value - min) / range) * height
    return { x, y }
  })

  // Gera path com curvas suaves usando smooth quadratic bezier curves
  let path = `M ${points[0].x} ${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    
    if (i === 1) {
      // Primeiro segmento: linha reta até o ponto médio
      const midX = (prev.x + curr.x) / 2
      const midY = (prev.y + curr.y) / 2
      path += ` L ${midX} ${midY}`
    }
    
    if (i < points.length - 1) {
      // Ponto médio entre atual e próximo
      const next = points[i + 1]
      const midX = (curr.x + next.x) / 2
      const midY = (curr.y + next.y) / 2
      // Usa quadratic bezier para suavizar
      path += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`
    } else {
      // Último ponto: linha reta até o final
      path += ` L ${curr.x} ${curr.y}`
    }
  }

  return path
}

export function SparklineCard({ label, value, delta, isPositive, data, valueType = 'number', dates, compareValue, compareLabel }: SparklineCardProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; index: number; date?: string } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Garantir que data é um array válido
  const validData = Array.isArray(data) ? data : []

  const deltaColor = isPositive
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'

  const DeltaIcon = isPositive ? ArrowUp : ArrowDown

  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value

  const formattedDelta = `${isPositive ? '+' : ''}${delta.toFixed(1)}%`

  // Dimensões do sparkline
  const sparklineWidth = 200
  const sparklineHeight = 50

  const sparklinePath = generateSparklinePath(validData, sparklineWidth, sparklineHeight)

  // Formata o valor para o tooltip
  const formatTooltipValue = (val: number): string => {
    switch (valueType) {
      case 'currency':
        return formatCurrency(val)
      case 'decimal':
        return val.toFixed(2)
      case 'number':
      default:
        return formatNumber(val)
    }
  }

  // Calcula o índice do ponto baseado na posição X do mouse
  const getDataIndexFromMouseX = (mouseX: number, svgElement: SVGSVGElement): number => {
    const rect = svgElement.getBoundingClientRect()
    const x = mouseX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const dataLength = validData.length || 1
    const index = Math.floor(percentage * (dataLength - 1))
    return Math.max(0, Math.min(dataLength - 1, index))
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !validData || validData.length === 0) return

    const index = getDataIndexFromMouseX(e.clientX, svgRef.current)
    const pointValue = validData[index]
    const pointDate = dates && dates[index] ? dates[index] : undefined

    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      setTooltip({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top - 60, // Posiciona acima do cursor
        value: pointValue,
        index,
        date: pointDate,
      })
    }
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 relative" ref={containerRef}>
          {/* Métrica Principal */}
          <div className="text-2xl font-bold">{formattedValue}</div>
          
          {/* Valor de comparação */}
          {compareValue !== undefined && (
            <p className="text-xs text-muted-foreground">
              {compareLabel || 'vs período anterior'}: {compareValue}
            </p>
          )}
          
          {/* Indicador Delta */}
          <Badge
            variant="secondary"
            className={cn('gap-1 w-fit', deltaColor)}
          >
            <DeltaIcon className="h-3 w-3" />
            {formattedDelta}
          </Badge>

          {/* Sparkline */}
          <div className="mt-4 -mb-2 relative">
            <svg
              ref={svgRef}
              width="100%"
              height={sparklineHeight}
              viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
              preserveAspectRatio="none"
              className="overflow-visible cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Área preenchida com opacidade baixa */}
              <defs>
                <linearGradient id={`gradient-${isPositive ? 'green' : 'red'}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isPositive ? '#16a34a' : '#dc2626'} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={isPositive ? '#16a34a' : '#dc2626'} stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              {/* Área preenchida */}
              {sparklinePath && (
                <path
                  d={`${sparklinePath} L ${sparklineWidth} ${sparklineHeight} L 0 ${sparklineHeight} Z`}
                  fill={`url(#gradient-${isPositive ? 'green' : 'red'})`}
                />
              )}
              
              {/* Linha do sparkline */}
              {sparklinePath && (
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke={isPositive ? '#16a34a' : '#dc2626'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Indicador vertical no ponto do tooltip */}
              {tooltip && validData.length > 0 && (() => {
                const min = Math.min(...validData)
                const max = Math.max(...validData)
                const range = max - min || 1
                const x = (tooltip.index / (validData.length - 1 || 1)) * sparklineWidth
                const y = sparklineHeight - ((tooltip.value - min) / range) * sparklineHeight
                
                return (
                  <>
                    {/* Linha vertical */}
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={sparklineHeight}
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      className="text-muted-foreground opacity-50"
                    />
                    {/* Ponto no gráfico */}
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={isPositive ? '#16a34a' : '#dc2626'}
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
                )
              })()}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute z-10 px-2 py-1.5 text-xs bg-popover border border-border rounded-md shadow-lg pointer-events-none min-w-[100px]"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                {tooltip.date && (
                  <div className="text-muted-foreground text-[10px] mb-1">
                    {formatDate(tooltip.date)}
                  </div>
                )}
                <div className="text-foreground font-semibold">
                  {formatTooltipValue(tooltip.value)}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Exemplo de uso:
 * 
 * import { SparklineCard } from '@/components/dashboard/SparklineCard'
 * 
 * // Dados mockados para exemplo
 * const revenueData = [45000, 52000, 48000, 61000, 55000, 68000, 72000, 78989]
 * 
 * <SparklineCard
 *   label="Total Revenue"
 *   value="R$ 78.989,83"
 *   delta={12.5}
 *   isPositive={true}
 *   data={revenueData}
 * />
 * 
 * <SparklineCard
 *   label="Custo por Clique"
 *   value="R$ 2,45"
 *   delta={-8.3}
 *   isPositive={false}
 *   data={[2.8, 2.6, 2.5, 2.4, 2.3, 2.5, 2.4, 2.45]}
 * />
 */
