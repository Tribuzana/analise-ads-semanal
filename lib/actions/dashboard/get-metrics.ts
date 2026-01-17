'use server'

import { createClient } from '@/lib/supabase/server'
import type { FilterState } from '@/types'
import type { DashboardMetrics, PlatformMetrics, ComparisonMetrics } from '@/types/dashboard'
import { calculateROAS, calculateCPA, calculateCTR, calculateCPC } from '@/lib/utils/calculations'
import { mapHotelToClient } from '@/lib/utils/hotel-mapping'
import { getPreviousPeriodRange, getLast4Weeks } from '@/lib/utils/date-helpers'

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

    // Query base - buscar todos os dados quando não há hotéis selecionados
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
      
      // Se há filtros de cidade/estado mas nenhum hotel corresponde, retornar vazio
      if (hotelIds.length === 0) {
        console.warn('[getDashboardMetrics] Nenhum hotel encontrado para os filtros de cidade/estado')
        return {
          geral: getEmptyMetrics(),
          googleAds: getEmptyMetrics(),
          metaAds: getEmptyMetrics(),
        }
      }
    }

    // Filtrar por hotéis apenas se houver seleção
    if (filters.selectedHotels.length > 0) {
      // Buscar todos os clientes únicos disponíveis no período
      const { data: uniqueClients, error: clientsError } = await supabase
        .from('metricas_ads')
        .select('client')
        .gte('date', filters.startDate)
        .lte('date', filters.endDate)
      
      if (clientsError) {
        console.error('[getDashboardMetrics] Erro ao buscar clientes únicos:', clientsError)
      }
      
      // Mapear nomes de hotéis selecionados para clientes correspondentes
      const matchingClients = new Set<string>()
      const clientSet = new Set<string>(uniqueClients?.map((c: any) => c.client).filter((c: any): c is string => Boolean(c) && typeof c === 'string') || [])
      
      console.log('[getDashboardMetrics] Clientes únicos encontrados:', clientSet.size)
      
      filters.selectedHotels.forEach(hotelName => {
        const mapped = mapHotelToClient(hotelName)
        // Procurar correspondências exatas ou parciais
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
      
      console.log('[getDashboardMetrics] Clientes correspondentes:', Array.from(matchingClients))
      
      if (matchingClients.size > 0) {
        query = query.in('client', Array.from(matchingClients))
      } else {
        // Se não encontrou correspondências, retornar vazio em vez de buscar tudo
        console.warn('[getDashboardMetrics] Nenhum cliente correspondente encontrado para os hotéis selecionados')
        return {
          geral: getEmptyMetrics(),
          googleAds: getEmptyMetrics(),
          metaAds: getEmptyMetrics(),
        }
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

    // Sempre buscar dados do período anterior equivalente
    const previousRange = getPreviousPeriodRange(filters.startDate, filters.endDate)
    console.log('[getDashboardMetrics] Buscando dados do período anterior:', previousRange)

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
  const investment = data.reduce((sum, d) => sum + (d.spend || 0), 0)
  const revenue = data.reduce((sum, d) => sum + (d.conversions_value || 0), 0)
  const conversions = data.reduce((sum, d) => sum + (d.conversions || 0), 0)
  const clicks = data.reduce((sum, d) => sum + (d.clicks || 0), 0)
  const impressions = data.reduce((sum, d) => sum + (d.impressions || 0), 0)

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
      clientSet.forEach((client) => {
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

  let query = supabase
    .from('metricas_ads')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)

  // Aplicar filtros de hotel/cidade/estado se existirem
  if (filters.selectedHotels.length > 0) {
    const { data: uniqueClients } = await supabase
      .from('metricas_ads')
      .select('client')
      .gte('date', startDate)
      .lte('date', endDate)
    
    const matchingClients = new Set<string>()
    const clientSet = new Set<string>(uniqueClients?.map((c: any) => c.client).filter((c: any): c is string => Boolean(c) && typeof c === 'string') || [])
    
    filters.selectedHotels.forEach(hotelName => {
      const mapped = mapHotelToClient(hotelName)
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
    } else {
      return []
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

  const { data, error } = await query
  
  if (error) {
    console.error('[getLast4WeeksData] Erro ao buscar dados:', error)
    return []
  }

  return data || []
}

