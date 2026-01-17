'use server'

import { createClient } from '@/lib/supabase/server'
import { getMatchingClients } from '@/lib/supabase/filter-helpers'
import type { FilterState } from '@/types'
import type { DashboardMetrics, PlatformMetrics, ComparisonMetrics } from '@/types/dashboard'
import { calculateROAS, calculateCPA, calculateCTR, calculateCPC } from '@/lib/utils/calculations'
import { mapHotelToClient } from '@/lib/utils/hotel-mapping'
import { getPreviousPeriodRange, getLast4Weeks, getYearAgoRange } from '@/lib/utils/date-helpers'

export async function getDashboardMetrics(filters: FilterState): Promise<DashboardMetrics> {
  const supabase = createClient()

  try {
    // Validar datas
    if (!filters.startDate || !filters.endDate) {
      console.warn('[getDashboardMetrics] Datas não definidas nos filtros')
      return {
        geral: getEmptyMetrics(),
        googleAds: getEmptyMetrics(),
        metaAds: getEmptyMetrics(),
      }
    }

    console.log('[getDashboardMetrics] Iniciando busca:', {
      startDate: filters.startDate,
      endDate: filters.endDate,
      selectedHotels: filters.selectedHotels.length,
    })

    // 1. Buscar IDs de conta correspondentes usando o helper centralizado
    const matchingAccountIds = await getMatchingClients(supabase, filters)

    // Se filtrou mas não achou nenhuma conta, retorna vazio
    if (matchingAccountIds !== null && matchingAccountIds.length === 0) {
      console.warn('[getDashboardMetrics] Nenhum ID de conta correspondente encontrado')
      return {
        geral: getEmptyMetrics(),
        googleAds: getEmptyMetrics(),
        metaAds: getEmptyMetrics(),
      }
    }

    // 2. Query principal
    let query = supabase
      .from('metricas_ads')
      .select('*')
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)
      .limit(10000)

    if (matchingAccountIds !== null) {
      query = query.in('account_id', matchingAccountIds)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getDashboardMetrics] Erro na query do Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw error
    }

    console.log(`[getDashboardMetrics] Encontrados ${data?.length || 0} registros para o período ${filters.startDate} a ${filters.endDate}`)

    if (!data || data.length === 0) {
      console.warn('[getDashboardMetrics] Nenhum dado encontrado para o período selecionado')
      return {
        geral: getEmptyMetrics(),
        googleAds: getEmptyMetrics(),
        metaAds: getEmptyMetrics(),
      }
    }

    // Separar por plataforma (suporta tanto "Google"/"Meta" quanto "Google Ads"/"Meta Ads")
    const googleData = data.filter(d => d.platform === 'Google Ads' || d.platform === 'Google')
    const metaData = data.filter(d => d.platform === 'Meta Ads' || d.platform === 'Meta')
    
    console.log(`[getDashboardMetrics] Google: ${googleData.length} registros, Meta: ${metaData.length} registros`)

    // Calcular métricas gerais
    const geral = calculatePlatformMetrics([...googleData, ...metaData])
    const googleAds = calculatePlatformMetrics(googleData)
    const metaAds = calculatePlatformMetrics(metaData)

    console.log('[getDashboardMetrics] Métricas calculadas:', {
      geral: { investment: geral.investment, revenue: geral.revenue, roas: geral.roas },
      googleAds: { investment: googleAds.investment, revenue: googleAds.revenue, roas: googleAds.roas },
      metaAds: { investment: metaAds.investment, revenue: metaAds.revenue, roas: metaAds.roas },
    })

    const result: DashboardMetrics = { geral, googleAds, metaAds }

    // Sempre buscar dados do período de comparação
    const previousRange = filters.compareYearAgo 
      ? getYearAgoRange(filters.startDate, filters.endDate)
      : getPreviousPeriodRange(filters.startDate, filters.endDate)
    
    console.log(`[getDashboardMetrics] Buscando dados do período de comparação (${filters.compareYearAgo ? 'Ano Anterior' : 'Período Anterior'}):`, previousRange)

    // Buscar dados do período anterior com os mesmos filtros
    const previousData = await fetchMetricsForPeriod(
      supabase,
      previousRange.startDate,
      previousRange.endDate,
      filters.selectedHotels,
      filters.selectedCidades,
      filters.selectedEstados
    )

    const previousGoogleData = previousData.filter(d => d.platform === 'Google Ads' || d.platform === 'Google')
    const previousMetaData = previousData.filter(d => d.platform === 'Meta Ads' || d.platform === 'Meta')

    const previousGeral = calculatePlatformMetrics([...previousGoogleData, ...previousMetaData])
    const previousGoogleAds = calculatePlatformMetrics(previousGoogleData)
    const previousMetaAds = calculatePlatformMetrics(previousMetaData)

    result.comparison = {
      geral: calculateComparison(geral, previousGeral),
      googleAds: calculateComparison(googleAds, previousGoogleAds),
      metaAds: calculateComparison(metaAds, previousMetaAds),
    }

    console.log('[getDashboardMetrics] Comparação com período anterior calculada:', {
      geral: result.comparison.geral.delta,
      googleAds: result.comparison.googleAds.delta,
      metaAds: result.comparison.metaAds.delta,
    })

    return result
  } catch (error: any) {
    console.error('[getDashboardMetrics] Erro ao buscar métricas:', {
      message: error?.message,
      stack: error?.stack,
    })
    return {
      geral: getEmptyMetrics(),
      googleAds: getEmptyMetrics(),
      metaAds: getEmptyMetrics(),
    }
  }
}

function calculatePlatformMetrics(data: any[]): PlatformMetrics {
  const investment = data.reduce((sum, d) => sum + parseFloat(String(d.spend || 0)), 0)
  // Coalesce para suportar tanto Google (conversions_value) quanto Meta (action_value_omni_purchase)
  const revenue = data.reduce((sum, d) => sum + parseFloat(String(d.conversions_value || d.action_value_omni_purchase || 0)), 0)
  const conversions = data.reduce((sum, d) => sum + parseInt(String(d.conversions || d.action_omni_purchase || d.action_leads || 0), 10), 0)
  const clicks = data.reduce((sum, d) => sum + parseInt(String(d.clicks || 0), 10), 0)
  const impressions = data.reduce((sum, d) => sum + parseInt(String(d.impressions || 0), 10), 0)

  return {
    investment,
    revenue,
    conversions,
    roas: calculateROAS(revenue, investment),
    clicks,
    impressions,
    ctr: calculateCTR(clicks, impressions),
    cpc: calculateCPC(investment, clicks),
    cpa: calculateCPA(investment, conversions),
  }
}

function getEmptyMetrics(): PlatformMetrics {
  return {
    investment: 0,
    revenue: 0,
    conversions: 0,
    roas: 0,
    clicks: 0,
    impressions: 0,
    ctr: 0,
    cpc: 0,
    cpa: 0,
  }
}

async function fetchMetricsForPeriod(
  supabase: any,
  startDate: string,
  endDate: string,
  selectedHotels: string[],
  selectedCidades: string[],
  selectedEstados: string[]
): Promise<any[]> {
  const matchingAccountIds = await getMatchingClients(supabase, {
    startDate,
    endDate,
    selectedHotels,
    selectedCidades,
    selectedEstados,
  })

  if (matchingAccountIds !== null && matchingAccountIds.length === 0) {
    return []
  }

  let query = supabase
    .from('metricas_ads')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .limit(10000)

  if (matchingAccountIds !== null) {
    query = query.in('account_id', matchingAccountIds)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('[fetchMetricsForPeriod] Erro ao buscar dados:', error)
    return []
  }

  return data || []
}

function calculateComparison(current: PlatformMetrics, previous: PlatformMetrics): ComparisonMetrics {
  const calculateDelta = (currentValue: number, previousValue: number): number => {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0
    }
    return ((currentValue - previousValue) / previousValue) * 100
  }

  return {
    previous,
    delta: {
      investment: calculateDelta(current.investment, previous.investment),
      revenue: calculateDelta(current.revenue, previous.revenue),
      conversions: calculateDelta(current.conversions, previous.conversions),
      roas: calculateDelta(current.roas, previous.roas),
      clicks: calculateDelta(current.clicks, previous.clicks),
      impressions: calculateDelta(current.impressions, previous.impressions),
      ctr: calculateDelta(current.ctr, previous.ctr),
      cpc: calculateDelta(current.cpc, previous.cpc),
      cpa: calculateDelta(current.cpa, previous.cpa),
    },
  }
}

/**
 * Busca dados das últimas 4 semanas independente dos filtros de data
 * Respeita apenas filtros de hotéis/cidades/estados
 */
export async function getLast4WeeksData(filters: Pick<FilterState, 'selectedHotels' | 'selectedCidades' | 'selectedEstados'>) {
  const supabase = createClient()
  const { startDate, endDate } = getLast4Weeks()

  const matchingAccountIds = await getMatchingClients(supabase, {
    startDate,
    endDate,
    selectedHotels: filters.selectedHotels,
    selectedCidades: filters.selectedCidades,
    selectedEstados: filters.selectedEstados,
  })

  if (matchingAccountIds !== null && matchingAccountIds.length === 0) {
    return []
  }

  let query = supabase
    .from('metricas_ads')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .limit(10000)

  if (matchingAccountIds !== null) {
    query = query.in('account_id', matchingAccountIds)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('[getLast4WeeksData] Erro ao buscar dados:', error)
    return []
  }

  return data || []
}

