'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface BarChartProps {
  data: Array<{
    [key: string]: string | number
  }>
  dataKeys: Array<{
    key: string
    name: string
    color: string
  }>
  xAxisKey: string
  yAxisFormatter?: (value: any) => string
}

export function BarChart({ data, dataKeys, xAxisKey, yAxisFormatter }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
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
            // Formatar ROAS como "12,34x"
            if (name === 'ROAS' || name === 'roas') {
              return `${Number(value).toFixed(2).replace('.', ',')}x`
            }
            return value
          }}
        />
        <Legend />
        {dataKeys.map(({ key, name, color }) => (
          <Bar key={key} dataKey={key} name={name} fill={color} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
