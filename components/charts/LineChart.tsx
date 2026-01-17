'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format'

interface LineChartProps {
  data: Array<{
    date: string
    [key: string]: string | number
  }>
  dataKeys: Array<{
    key: string
    name: string
    color: string
    formatter?: (value: any) => string
  }>
  xAxisKey?: string
  yAxisFormatter?: (value: any) => string
}

export function LineChart({ data, dataKeys, xAxisKey = 'date', yAxisFormatter }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickFormatter={yAxisFormatter}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={(value: any, name?: string) => {
            const dataKey = dataKeys.find(dk => dk.key === name || dk.name === name)
            if (dataKey?.formatter) {
              return dataKey.formatter(value)
            }
            // Formatação padrão baseada no nome
            if (name === 'Investimento' || name === 'Receita') {
              return formatCurrency(value)
            }
            if (name === 'ROAS' || name === 'roas') {
              return `${Number(value).toFixed(2).replace('.', ',')}x`
            }
            return value
          }}
        />
        {dataKeys.map(({ key, name, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
