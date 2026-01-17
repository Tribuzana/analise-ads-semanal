import { calculateROAS } from '@/lib/utils/calculations'
import { startOfWeek, format } from 'date-fns'

/**
 * Processa dados temporais para gráficos das últimas 4 semanas
 */
export function processLast4WeeksTemporalData(data: any[]): Array<{ date: string; spend: number; revenue: number; roas: number }> {
  const dateMap = new Map<string, any>()

  data.forEach(row => {
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, {
        date: row.date,
        spend: 0,
        revenue: 0,
      })
    }

    const day = dateMap.get(row.date)
    day.spend += parseFloat(String(row.spend || 0))
    day.revenue += parseFloat(String(row.conversions_value || 0))
  })

  return Array.from(dateMap.values())
    .map(d => ({
      date: d.date,
      spend: d.spend,
      revenue: d.revenue,
      roas: calculateROAS(d.revenue, d.spend),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Agrupa dados temporais por semana (domingo a sábado)
 */
export function groupDataByWeek(data: Array<{ date: string; spend: number; revenue: number; roas: number }>): Array<{ date: string; spend: number; revenue: number; roas: number; weekLabel: string }> {
  const weekMap = new Map<string, { spend: number; revenue: number; startDate: Date }>()

  data.forEach(d => {
    const date = new Date(d.date)
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }) // 0 = domingo
    const weekKey = format(weekStart, 'yyyy-MM-dd')

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        spend: 0,
        revenue: 0,
        startDate: weekStart,
      })
    }

    const week = weekMap.get(weekKey)!
    week.spend += d.spend
    week.revenue += d.revenue
  })

  return Array.from(weekMap.entries())
    .map(([weekKey, week]) => {
      const weekEnd = new Date(week.startDate)
      weekEnd.setDate(weekEnd.getDate() + 6) // Sábado
      
      return {
        date: weekKey,
        spend: week.spend,
        revenue: week.revenue,
        roas: calculateROAS(week.revenue, week.spend),
        weekLabel: `${format(week.startDate, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calcula KPIs de campanhas ativas/pausadas por plataforma
 */
export function calculateCampaignStatusKPIs(data: any[]): {
  activeGoogle: number
  pausedGoogle: number
  activeMeta: number
  pausedMeta: number
} {
  const campaignMap = new Map<string, { platform: string; status: string | null }>()

  data.forEach(row => {
    const key = `${row.campaign_id}_${row.platform}`
    if (!campaignMap.has(key)) {
      campaignMap.set(key, {
        platform: row.platform === 'Google' || row.platform === 'Google Ads' ? 'Google' : 'Meta',
        status: row.campaign_status,
      })
    }
  })

  let activeGoogle = 0
  let pausedGoogle = 0
  let activeMeta = 0
  let pausedMeta = 0

  campaignMap.forEach(campaign => {
    const status = campaign.status?.toUpperCase() || ''
    const isActive = status === 'ACTIVE' || status === 'ENABLED' || status === ''
    const isPaused = status === 'PAUSED' || status === 'PAUSE'

    if (campaign.platform === 'Google') {
      if (isActive) activeGoogle++
      if (isPaused) pausedGoogle++
    } else {
      if (isActive) activeMeta++
      if (isPaused) pausedMeta++
    }
  })

  return {
    activeGoogle,
    pausedGoogle,
    activeMeta,
    pausedMeta,
  }
}
