'use server'

import { createClient } from '@/lib/supabase/server'
import type { FilterState } from '@/types'
import type { MarketingAnalyticsData, CampaignData, ObjectiveAnalysis, TemporalData, CampaignPeriodMetrics } from '@/types/marketing'
import { calculateROAS, calculateCPA, calculateCPC, calculateCTR } from '@/lib/utils/calculations'
import { mapHotelToClient } from '@/lib/utils/hotel-mapping'
import { getPreviousPeriodRange } from '@/lib/utils/date-helpers'

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
        temporalData: [],
        topCampaigns: [],
      }
    }

    // Query base
    let query = supabase
      .from('metricas_ads')
      .select('*')
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)

    // Buscar hotéis que correspondem aos filtros de cidade/estado
    let hotelIds: number[] = []
    if (filters.selectedCidades.length > 0 || filters.selectedEstados.length > 0) {
      const hotelQuery = supabase
        .from('hoteis_config')
        .select('id, nome_hotel')
        .eq('ativo', true)
      
      if (filters.selectedCidades.length > 0) {
        hotelQuery.in('cidade', filters.selectedCidades)
      }
      if (filters.selectedEstados.length > 0) {
        hotelQuery.in('estado', filters.selectedEstados)
      }
      
      const { data: hoteisFiltrados } = await hotelQuery
      hotelIds = hoteisFiltrados?.map((h: any) => h.id) || []
      
      if (hotelIds.length === 0) {
        console.warn('[getMarketingAnalytics] Nenhum hotel encontrado para os filtros de cidade/estado')
        return {
          campaigns: [],
          objectiveAnalysis: [],
          temporalData: [],
          topCampaigns: [],
        }
      }
    }

    // Filtrar por hotéis
    if (filters.selectedHotels.length > 0) {
      // Buscar todos os clientes únicos disponíveis
      const { data: uniqueClients } = await supabase
        .from('metricas_ads')
        .select('client')
        .gte('date', filters.startDate)
        .lte('date', filters.endDate)
      
      // Mapear nomes de hotéis selecionados para clientes correspondentes
      const matchingClients = new Set<string>()
      const clientSet = new Set<string>(uniqueClients?.map((c: any) => c.client).filter((c: any): c is string => Boolean(c) && typeof c === 'string') || [])
      
      filters.selectedHotels.forEach(hotelName => {
        const mapped = mapHotelToClient(hotelName)
        clientSet.forEach((client: string) => {
          if (client) {
            const normalizedClient = client.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            if (
              normalizedClient === mapped ||
              normalizedClient.includes(mapped) ||
              mapped.includes(normalizedClient)
            ) {
              matchingClients.add(client)
            }
          }
        })
      })
      
      if (matchingClients.size > 0) {
        query = query.in('client', Array.from(matchingClients))
      }
    } else if (hotelIds.length > 0) {
      // Se há filtros de cidade/estado mas não há hotéis selecionados explicitamente,
      // buscar nomes dos hotéis filtrados e mapear para clientes
      const { data: hoteisData } = await supabase
        .from('hoteis_config')
        .select('nome_hotel')
        .in('id', hotelIds)
      
      if (hoteisData && hoteisData.length > 0) {
        const { data: uniqueClients } = await supabase
          .from('metricas_ads')
          .select('client')
          .gte('date', filters.startDate)
          .lte('date', filters.endDate)
        
        const matchingClients = new Set<string>()
        const clientSet = new Set<string>(uniqueClients?.map((c: any) => c.client).filter((c: any): c is string => Boolean(c) && typeof c === 'string') || [])
        
        hoteisData.forEach((hotel: any) => {
          const mapped = mapHotelToClient(hotel.nome_hotel)
          clientSet.forEach((client: string) => {
            if (client) {
              const normalizedClient = client.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              const normalizedMapped = mapped.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              
              if (
                normalizedClient === normalizedMapped ||
                normalizedClient.includes(normalizedMapped) ||
                normalizedMapped.includes(normalizedClient)
              ) {
                matchingClients.add(client)
              }
            }
          })
        })
        
        if (matchingClients.size > 0) {
          query = query.in('client', Array.from(matchingClients))
        }
      }
    }

    // Filtros adicionais
    if (options?.platforms && options.platforms.length > 0) {
      // Normalizar plataformas (suporta tanto "Google"/"Meta" quanto "Google Ads"/"Meta Ads")
      const normalizedPlatforms = new Set<string>()
      options.platforms.forEach(p => {
        if (p === 'Google Ads' || p === 'Google') {
          normalizedPlatforms.add('Google')
          normalizedPlatforms.add('Google Ads')
        } else if (p === 'Meta Ads' || p === 'Meta') {
          normalizedPlatforms.add('Meta')
          normalizedPlatforms.add('Meta Ads')
        } else {
          normalizedPlatforms.add(p)
        }
      })
      query = query.in('platform', Array.from(normalizedPlatforms))
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
    const temporalData = analyzeTemporalData(filteredData)
    const topCampaigns = campaigns
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 10)

    const result: MarketingAnalyticsData = {
      campaigns,
      objectiveAnalysis,
      temporalData,
      topCampaigns,
    }

    // Sempre buscar dados do período anterior equivalente
    const previousRange = getPreviousPeriodRange(filters.startDate, filters.endDate)
    console.log('[getMarketingAnalytics] Buscando dados do período anterior:', previousRange)

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
    const previousTemporalData = analyzeTemporalData(previousData || [])
    const previousTopCampaigns = previousCampaigns
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 10)

    result.comparison = {
      campaigns: previousCampaigns,
      objectiveAnalysis: previousObjectiveAnalysis,
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
        campaign_status: row.campaign_status,
        spend: 0,
        revenue: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0,
      })
    }

    const campaign = campaignMap.get(key)
    campaign.spend += parseFloat(String(row.spend || 0))
    campaign.revenue += parseFloat(String(row.conversions_value || 0))
    campaign.conversions += parseInt(String(row.conversions || 0), 10)
    campaign.clicks += parseInt(String(row.clicks || 0), 10)
    campaign.impressions += parseInt(String(row.impressions || 0), 10)
  })

  // Calcular métricas
  return Array.from(campaignMap.values()).map(c => ({
    ...c,
    roas: calculateROAS(c.revenue, c.spend),
    cpa: calculateCPA(c.spend, c.conversions),
    cpc: calculateCPC(c.spend, c.clicks),
    ctr: calculateCTR(c.clicks, c.impressions),
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
    obj.revenue += parseFloat(String(row.conversions_value || 0))
    obj.conversions += parseInt(String(row.conversions || 0), 10)
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
    day.revenue += parseFloat(String(row.conversions_value || 0))
    day.conversions += parseInt(String(row.conversions || 0), 10)
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
  let query = supabase
    .from('metricas_ads')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)

  // Aplicar mesmos filtros de hotel/cidade/estado
  if (selectedHotels.length > 0) {
    const { data: uniqueClients } = await supabase
      .from('metricas_ads')
      .select('client')
      .gte('date', startDate)
      .lte('date', endDate)
    
    const matchingClients = new Set<string>()
    const clientSet = new Set<string>(uniqueClients?.map((c: any) => c.client).filter((c: any): c is string => Boolean(c) && typeof c === 'string') || [])
    
    selectedHotels.forEach(hotelName => {
      const mapped = mapHotelToClient(hotelName)
      clientSet.forEach((client: string) => {
        if (client) {
          const normalizedClient = client.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          if (
            normalizedClient === mapped ||
            normalizedClient.includes(mapped) ||
            mapped.includes(normalizedClient)
          ) {
            matchingClients.add(client)
          }
        }
      })
    })
    
    if (matchingClients.size > 0) {
      query = query.in('client', Array.from(matchingClients))
    } else {
      return []
    }
  } else if (selectedCidades.length > 0 || selectedEstados.length > 0) {
    const hotelQuery = supabase
      .from('hoteis_config')
      .select('id, nome_hotel')
      .eq('ativo', true)
    
    if (selectedCidades.length > 0) {
      hotelQuery.in('cidade', selectedCidades)
    }
    if (selectedEstados.length > 0) {
      hotelQuery.in('estado', selectedEstados)
    }
    
    const { data: hoteisFiltrados } = await hotelQuery
    const hotelIds = hoteisFiltrados?.map((h: any) => h.id) || []
    
    if (hotelIds.length > 0) {
      const { data: hoteisData } = await supabase
        .from('hoteis_config')
        .select('nome_hotel')
        .in('id', hotelIds)
      
      if (hoteisData && hoteisData.length > 0) {
        const { data: uniqueClients } = await supabase
          .from('metricas_ads')
          .select('client')
          .gte('date', startDate)
          .lte('date', endDate)
        
        const matchingClients = new Set<string>()
        const clientSet = new Set<string>(uniqueClients?.map((c: any) => c.client).filter((c: any): c is string => Boolean(c) && typeof c === 'string') || [])
        
        hoteisData.forEach((hotel: any) => {
          const mapped = mapHotelToClient(hotel.nome_hotel)
          clientSet.forEach((client: string) => {
            if (client) {
              const normalizedClient = client.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              const normalizedMapped = mapped.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              
              if (
                normalizedClient === normalizedMapped ||
                normalizedClient.includes(normalizedMapped) ||
                normalizedMapped.includes(normalizedClient)
              ) {
                matchingClients.add(client)
              }
            }
          })
        })
        
        if (matchingClients.size > 0) {
          query = query.in('client', Array.from(matchingClients))
        }
      }
    }
  }

  // Filtros adicionais
  if (options?.platforms && options.platforms.length > 0) {
    const normalizedPlatforms = new Set<string>()
    options.platforms.forEach(p => {
      if (p === 'Google Ads' || p === 'Google') {
        normalizedPlatforms.add('Google')
        normalizedPlatforms.add('Google Ads')
      } else if (p === 'Meta Ads' || p === 'Meta') {
        normalizedPlatforms.add('Meta')
        normalizedPlatforms.add('Meta Ads')
      } else {
        normalizedPlatforms.add(p)
      }
    })
    query = query.in('platform', Array.from(normalizedPlatforms))
  }

  if (options?.statuses && options.statuses.length > 0) {
    query = query.in('campaign_status', options.statuses)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('[fetchAnalyticsForPeriod] Erro ao buscar dados:', error)
    return []
  }

  return data || []
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
      }
    }

    // Normalizar plataforma
    const normalizedPlatforms = platform === 'Google Ads' || platform === 'Google' 
      ? ['Google', 'Google Ads']
      : ['Meta', 'Meta Ads']

    // Query base para a campanha específica
    let query = supabase
      .from('metricas_ads')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('platform', normalizedPlatforms)
      .gte('date', filters.startDate)
      .lte('date', filters.endDate)

    // Aplicar filtros de hotel/cidade/estado se existirem
    if (filters.selectedHotels.length > 0) {
      const { data: uniqueClients } = await supabase
        .from('metricas_ads')
        .select('client')
        .gte('date', filters.startDate)
        .lte('date', filters.endDate)
      
      const matchingClients = new Set<string>()
      const clientSet = new Set<string>(uniqueClients?.map((c: any) => c.client).filter((c: any): c is string => Boolean(c) && typeof c === 'string') || [])
      
      filters.selectedHotels.forEach(hotelName => {
        const mapped = mapHotelToClient(hotelName)
        clientSet.forEach((client: string) => {
          if (client) {
            const normalizedClient = client.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            if (
              normalizedClient === mapped ||
              normalizedClient.includes(mapped) ||
              mapped.includes(normalizedClient)
            ) {
              matchingClients.add(client)
            }
          }
        })
      })
      
      if (matchingClients.size > 0) {
        query = query.in('client', Array.from(matchingClients))
      }
    } else if (filters.selectedCidades.length > 0 || filters.selectedEstados.length > 0) {
      const hotelQuery = supabase
        .from('hoteis_config')
        .select('id, nome_hotel')
        .eq('ativo', true)
      
      if (filters.selectedCidades.length > 0) {
        hotelQuery.in('cidade', filters.selectedCidades)
      }
      if (filters.selectedEstados.length > 0) {
        hotelQuery.in('estado', filters.selectedEstados)
      }
      
      const { data: hoteisFiltrados } = await hotelQuery
      const hotelIds = hoteisFiltrados?.map((h: any) => h.id) || []
      
      if (hotelIds.length > 0) {
        const { data: hoteisData } = await supabase
          .from('hoteis_config')
          .select('nome_hotel')
          .in('id', hotelIds)
        
        if (hoteisData && hoteisData.length > 0) {
          const { data: uniqueClients } = await supabase
            .from('metricas_ads')
            .select('client')
            .gte('date', filters.startDate)
            .lte('date', filters.endDate)
          
          const matchingClients = new Set<string>()
          const clientSet = new Set<string>(uniqueClients?.map((c: any) => c.client).filter((c: any): c is string => Boolean(c) && typeof c === 'string') || [])
          
          hoteisData.forEach((hotel: any) => {
            const mapped = mapHotelToClient(hotel.nome_hotel)
            clientSet.forEach((client: string) => {
              if (client) {
                const normalizedClient = client.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                const normalizedMapped = mapped.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                
                if (
                  normalizedClient === normalizedMapped ||
                  normalizedClient.includes(normalizedMapped) ||
                  normalizedMapped.includes(normalizedClient)
                ) {
                  matchingClients.add(client)
                }
              }
            })
          })
          
          if (matchingClients.size > 0) {
            query = query.in('client', Array.from(matchingClients))
          }
        }
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('[getCampaignPeriodMetrics] Erro na query:', error)
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
      }
    }

    // Agregar métricas do período
    const metrics = {
      spend: 0,
      revenue: 0,
      conversions: 0,
      clicks: 0,
      impressions: 0,
    }

    data?.forEach(row => {
      metrics.spend += parseFloat(String(row.spend || 0))
      metrics.revenue += parseFloat(String(row.conversions_value || 0))
      metrics.conversions += parseInt(String(row.conversions || 0), 10)
      metrics.clicks += parseInt(String(row.clicks || 0), 10)
      metrics.impressions += parseInt(String(row.impressions || 0), 10)
    })

    // Calcular métricas derivadas
    return {
      ...metrics,
      roas: calculateROAS(metrics.revenue, metrics.spend),
      cpa: calculateCPA(metrics.spend, metrics.conversions),
      cpc: calculateCPC(metrics.spend, metrics.clicks),
      ctr: calculateCTR(metrics.clicks, metrics.impressions),
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
    }
  }
}
