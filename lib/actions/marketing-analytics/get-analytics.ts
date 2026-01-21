'use server'

import { createClient } from '@/lib/supabase/server'
import { getMatchingClients, normalizePlatforms } from '@/lib/supabase/filter-helpers'
import type { FilterState } from '@/types'
import type { Database } from '@/types/database'
import type { MarketingAnalyticsData, CampaignData, ObjectiveAnalysis, BiddingStrategyAnalysis, TemporalData, CampaignPeriodMetrics } from '@/types/marketing'

type MetricaAds = Database['public']['Tables']['metricas_ads']['Row']
import { calculateROAS, calculateCPA, calculateCPC, calculateCTR, calculateCPM, calculateFrequency } from '@/lib/utils/calculations'
import { mapHotelToClient } from '@/lib/utils/hotel-mapping'
import { getPreviousPeriodRange, getYearAgoRange } from '@/lib/utils/date-helpers'

export async function getMarketingAnalytics(
  filters: FilterState,
  options?: {
    platforms?: string[]
    objectives?: string[]
    statuses?: string[]
  }
): Promise<MarketingAnalyticsData> {
  const supabase = createClient()

  try {
    // Validar datas
    if (!filters.startDate || !filters.endDate) {
      console.warn('[getMarketingAnalytics] Datas não definidas nos filtros')
      return {
        campaigns: [],
        objectiveAnalysis: [],
        biddingStrategyAnalysis: [],
        temporalData: [],
        topCampaigns: [],
      }
    }

    // 1. Buscar IDs de conta correspondentes usando o helper centralizado
    const { accountIds: matchingAccountIds } = await getMatchingClients(supabase, filters)

    // Se filtrou mas não achou nenhuma conta, retorna vazio
    if (matchingAccountIds !== null && matchingAccountIds.length === 0) {
      console.warn('[getMarketingAnalytics] Nenhum ID de conta correspondente encontrado')
      return {
        campaigns: [],
        objectiveAnalysis: [],
        biddingStrategyAnalysis: [],
        temporalData: [],
        topCampaigns: [],
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

    // Filtros adicionais
    if (options?.platforms && options.platforms.length > 0) {
      const normalizedPlatforms = normalizePlatforms(options.platforms)
      query = query.in('platform', normalizedPlatforms)
    }

    if (options?.statuses && options.statuses.length > 0) {
      query = query.in('campaign_status', options.statuses)
    }

    // Aplicar filtro de objetivos de campanha
    const objectivesToFilter = filters.selectedObjectives.length > 0 
      ? filters.selectedObjectives 
      : options?.objectives || []
    
    if (objectivesToFilter.length > 0) {
      query = query.in('campaign_objective', objectivesToFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getMarketingAnalytics] Erro na query:', error)
      throw error
    }

    console.log(`[getMarketingAnalytics] Encontrados ${data?.length || 0} registros`)

    // Aplicar filtro de tipo de resultado após buscar os dados
    let filteredData = data || []
    if (filters.selectedResultTypes.length > 0) {
      filteredData = filteredData.filter(row => {
        // Verificar se a linha corresponde a algum tipo de resultado selecionado
        return filters.selectedResultTypes.some(resultType => {
          switch (resultType) {
            case 'Conversões':
              return (parseInt(String(row.conversions || 0), 10) > 0)
            case 'Leads':
              return (parseInt(String(row.action_leads || 0), 10) > 0)
            case 'Cliques em Links':
              return (parseInt(String(row.action_link_clicks || 0), 10) > 0)
            case 'Engajamentos em Posts':
              // Usar estimated_reach ou outras métricas de engajamento se disponíveis
              return (parseInt(String(row.estimated_reach || 0), 10) > 0) ||
                     (parseInt(String(row.frequency || 0), 10) > 0)
            case 'Compras':
              return (parseInt(String(row.action_omni_purchase || 0), 10) > 0) ||
                     (parseFloat(String(row.conversions_value || 0)) > 0)
            default:
              return false
          }
        })
      })
    }

    // Processar dados
    const campaigns = processCampaigns(filteredData)
    const objectiveAnalysis = analyzeByObjective(filteredData)
    const biddingStrategyAnalysis = analyzeByBiddingStrategy(filteredData)
    const temporalData = analyzeTemporalData(filteredData)
    const topCampaigns = campaigns
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 10)

    const result: MarketingAnalyticsData = {
      campaigns,
      objectiveAnalysis,
      biddingStrategyAnalysis,
      temporalData,
      topCampaigns,
    }

    // Sempre buscar dados do período de comparação
    const previousRange = filters.compareYearAgo
      ? getYearAgoRange(filters.startDate, filters.endDate)
      : getPreviousPeriodRange(filters.startDate, filters.endDate)
    
    console.log(`[getMarketingAnalytics] Buscando dados do período de comparação (${filters.compareYearAgo ? 'Ano Anterior' : 'Período Anterior'}):`, previousRange)

    // Buscar dados do período anterior com os mesmos filtros
    const previousData = await fetchAnalyticsForPeriod(
      supabase,
      previousRange.startDate,
      previousRange.endDate,
      filters.selectedHotels,
      filters.selectedCidades,
      filters.selectedEstados,
      {
        ...options,
        selectedObjectives: filters.selectedObjectives,
        selectedResultTypes: filters.selectedResultTypes,
      }
    )

    const previousCampaigns = processCampaigns(previousData || [])
    const previousObjectiveAnalysis = analyzeByObjective(previousData || [])
    const previousBiddingStrategyAnalysis = analyzeByBiddingStrategy(previousData || [])
    const previousTemporalData = analyzeTemporalData(previousData || [])
    const previousTopCampaigns = previousCampaigns
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 10)

    result.comparison = {
      campaigns: previousCampaigns,
      objectiveAnalysis: previousObjectiveAnalysis,
      biddingStrategyAnalysis: previousBiddingStrategyAnalysis,
      temporalData: previousTemporalData,
      topCampaigns: previousTopCampaigns,
    }

    console.log('[getMarketingAnalytics] Comparação com período anterior calculada')

    return result
  } catch (error) {
    console.error('[getMarketingAnalytics] Erro ao buscar analytics:', error)
    return {
      campaigns: [],
      objectiveAnalysis: [],
      biddingStrategyAnalysis: [],
      temporalData: [],
      topCampaigns: [],
    }
  }
}

function processCampaigns(data: any[]): CampaignData[] {
  const campaignMap = new Map<string, any>()

  // Agregar por campanha
  data.forEach(row => {
    const key = `${row.campaign_id}_${row.platform}`
    if (!campaignMap.has(key)) {
      campaignMap.set(key, {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        client: row.client,
        platform: row.platform === 'Google' ? 'Google Ads' : row.platform === 'Meta' ? 'Meta Ads' : row.platform,
        campaign_objective: row.campaign_objective,
        campaign_bidding_strategy_type: row.campaign_bidding_strategy_type,
        advertising_channel_type: row.advertising_channel_type,
        campaign_status: row.campaign_status,
        spend: 0,
        revenue: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0,
        estimated_reach: 0,
      })
    }

    const campaign = campaignMap.get(key)
    campaign.spend += parseFloat(String(row.spend || 0))
    // Coalesce para suportar tanto Google (conversions_value) quanto Meta (action_value_omni_purchase)
    campaign.revenue += parseFloat(String(row.conversions_value || row.action_value_omni_purchase || 0))
    campaign.conversions += parseInt(String(row.conversions || row.action_omni_purchase || row.action_leads || 0), 10)
    campaign.clicks += parseInt(String(row.clicks || 0), 10)
    campaign.impressions += parseInt(String(row.impressions || 0), 10)
    campaign.estimated_reach += parseInt(String(row.estimated_reach || 0), 10)
  })

  // Calcular métricas
  return Array.from(campaignMap.values()).map(c => ({
    ...c,
    roas: calculateROAS(c.revenue, c.spend),
    cpa: calculateCPA(c.spend, c.conversions),
    cpc: calculateCPC(c.spend, c.clicks),
    ctr: calculateCTR(c.clicks, c.impressions),
    cpm: calculateCPM(c.spend, c.impressions),
    frequency: calculateFrequency(c.impressions, c.estimated_reach),
  }))
}

function analyzeByObjective(data: any[]): ObjectiveAnalysis[] {
  const objectiveMap = new Map<string, any>()

  data.forEach(row => {
    const objective = row.campaign_objective || 'Não definido'
    if (!objectiveMap.has(objective)) {
      objectiveMap.set(objective, {
        objective,
        campaigns: new Set(),
        spend: 0,
        revenue: 0,
        conversions: 0,
      })
    }

    const obj = objectiveMap.get(objective)
    obj.campaigns.add(row.campaign_id)
    obj.spend += parseFloat(String(row.spend || 0))
    // Coalesce para suportar tanto Google (conversions_value) quanto Meta (action_value_omni_purchase)
    obj.revenue += parseFloat(String(row.conversions_value || row.action_value_omni_purchase || 0))
    obj.conversions += parseInt(String(row.conversions || row.action_omni_purchase || row.action_leads || 0), 10)
  })

  return Array.from(objectiveMap.values()).map(obj => ({
    objective: obj.objective,
    campaigns: obj.campaigns.size,
    spend: obj.spend,
    revenue: obj.revenue,
    conversions: obj.conversions,
    roas: calculateROAS(obj.revenue, obj.spend),
  }))
}

function analyzeByBiddingStrategy(data: any[]): BiddingStrategyAnalysis[] {
  const strategyMap = new Map<string, any>()

  data.forEach(row => {
    const strategy = row.campaign_bidding_strategy_type || 'Não definido'
    if (!strategyMap.has(strategy)) {
      strategyMap.set(strategy, {
        biddingStrategy: strategy,
        campaigns: new Set(),
        spend: 0,
        revenue: 0,
        conversions: 0,
      })
    }

    const strat = strategyMap.get(strategy)
    strat.campaigns.add(row.campaign_id)
    strat.spend += parseFloat(String(row.spend || 0))
    strat.revenue += parseFloat(String(row.conversions_value || row.action_value_omni_purchase || 0))
    strat.conversions += parseInt(String(row.conversions || row.action_omni_purchase || row.action_leads || 0), 10)
  })

  return Array.from(strategyMap.values()).map(strat => ({
    biddingStrategy: strat.biddingStrategy,
    campaigns: strat.campaigns.size,
    spend: strat.spend,
    revenue: strat.revenue,
    conversions: strat.conversions,
    roas: calculateROAS(strat.revenue, strat.spend),
  }))
}

function analyzeTemporalData(data: any[]): TemporalData[] {
  const dateMap = new Map<string, any>()

  data.forEach(row => {
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, {
        date: row.date,
        spend: 0,
        revenue: 0,
        conversions: 0,
      })
    }

    const day = dateMap.get(row.date)
    day.spend += parseFloat(String(row.spend || 0))
    // Coalesce para suportar tanto Google (conversions_value) quanto Meta (action_value_omni_purchase)
    day.revenue += parseFloat(String(row.conversions_value || row.action_value_omni_purchase || 0))
    day.conversions += parseInt(String(row.conversions || row.action_omni_purchase || row.action_leads || 0), 10)
  })

  return Array.from(dateMap.values())
    .map(d => ({
      ...d,
      roas: calculateROAS(d.revenue, d.spend),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function fetchAnalyticsForPeriod(
  supabase: any,
  startDate: string,
  endDate: string,
  selectedHotels: string[],
  selectedCidades: string[],
  selectedEstados: string[],
  options?: {
    platforms?: string[]
    objectives?: string[]
    statuses?: string[]
    selectedObjectives?: string[]
    selectedResultTypes?: string[]
  }
): Promise<any[]> {
  const { accountIds: matchingAccountIds } = await getMatchingClients(supabase, {
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

  // Filtros adicionais
  if (options?.platforms && options.platforms.length > 0) {
    const normalizedPlatforms = normalizePlatforms(options.platforms)
    query = query.in('platform', normalizedPlatforms)
  }

  if (options?.statuses && options.statuses.length > 0) {
    query = query.in('campaign_status', options.statuses)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('[fetchAnalyticsForPeriod] Erro ao buscar dados:', error)
    return []
  }

  let filteredData = data || []
  if (options?.selectedResultTypes && options.selectedResultTypes.length > 0) {
    filteredData = filteredData.filter((row: MetricaAds) => {
      return options.selectedResultTypes!.some(resultType => {
        switch (resultType) {
          case 'Conversões':
            return (parseInt(String(row.conversions || 0), 10) > 0)
          case 'Leads':
            return (parseInt(String(row.action_leads || 0), 10) > 0)
          case 'Cliques em Links':
            return (parseInt(String(row.action_link_clicks || 0), 10) > 0)
          case 'Engajamentos em Posts':
            return (parseInt(String(row.estimated_reach || 0), 10) > 0) ||
                   (parseInt(String(row.frequency || 0), 10) > 0)
          case 'Compras':
            return (parseInt(String(row.action_omni_purchase || 0), 10) > 0) ||
                   (parseFloat(String(row.conversions_value || 0)) > 0)
          default:
            return false
        }
      })
    })
  }

  return filteredData
}

export async function getCampaignPeriodMetrics(
  campaignId: string,
  platform: string,
  filters: FilterState
): Promise<CampaignPeriodMetrics> {
  const supabase = createClient()

  try {
    // Validar datas
    if (!filters.startDate || !filters.endDate) {
      return {
        spend: 0,
        revenue: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0,
        roas: 0,
        cpa: 0,
        cpc: 0,
        ctr: 0,
        cpm: 0,
        frequency: 0,
        estimated_reach: 0,
      }
    }

    // Normalizar plataforma
    const normalizedPlatforms = normalizePlatforms([platform])

    // Query base para a campanha específica
    let query = supabase
      .from('metricas_ads')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('platform', normalizedPlatforms)
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)
      .limit(10000)

    // Buscar IDs de conta correspondentes usando o helper centralizado
    const { accountIds: matchingAccountIds } = await getMatchingClients(supabase, filters)

    if (matchingAccountIds !== null) {
      if (matchingAccountIds.length === 0) {
        return {
          spend: 0,
          revenue: 0,
          conversions: 0,
          clicks: 0,
          impressions: 0,
          roas: 0,
          cpa: 0,
          cpc: 0,
          ctr: 0,
          cpm: 0,
          frequency: 0,
          estimated_reach: 0,
        }
      }
      query = query.in('account_id', matchingAccountIds)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getCampaignPeriodMetrics] Erro na query:', error)
      throw error
    }

    // Agregar métricas do período
    const metrics = {
      spend: 0,
      revenue: 0,
      conversions: 0,
      clicks: 0,
      impressions: 0,
      estimated_reach: 0,
    }

    data?.forEach(row => {
      metrics.spend += parseFloat(String(row.spend || 0))
      // Coalesce para suportar tanto Google (conversions_value) quanto Meta (action_value_omni_purchase)
      metrics.revenue += parseFloat(String(row.conversions_value || row.action_value_omni_purchase || 0))
      metrics.conversions += parseInt(String(row.conversions || row.action_omni_purchase || row.action_leads || 0), 10)
      metrics.clicks += parseInt(String(row.clicks || 0), 10)
      metrics.impressions += parseInt(String(row.impressions || 0), 10)
      metrics.estimated_reach += parseInt(String(row.estimated_reach || 0), 10)
    })

    // Calcular métricas derivadas
    return {
      ...metrics,
      roas: calculateROAS(metrics.revenue, metrics.spend),
      cpa: calculateCPA(metrics.spend, metrics.conversions),
      cpc: calculateCPC(metrics.spend, metrics.clicks),
      ctr: calculateCTR(metrics.clicks, metrics.impressions),
      cpm: calculateCPM(metrics.spend, metrics.impressions),
      frequency: calculateFrequency(metrics.impressions, metrics.estimated_reach),
    }
  } catch (error) {
    console.error('[getCampaignPeriodMetrics] Erro ao buscar métricas:', error)
    return {
      spend: 0,
      revenue: 0,
      conversions: 0,
      clicks: 0,
      impressions: 0,
      roas: 0,
      cpa: 0,
      cpc: 0,
      ctr: 0,
      cpm: 0,
      frequency: 0,
      estimated_reach: 0,
    }
  }
}
