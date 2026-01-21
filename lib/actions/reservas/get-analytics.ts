'use server'

import { createClient } from '@/lib/supabase/server'
import type { FilterState } from '@/types'
import { getPreviousPeriodRange, getYearAgoRange } from '@/lib/utils/date-helpers'

export interface DistribuicaoItem {
  faixa: string
  count: number
}

export interface ReservasAnalytics {
  totalBuscas: number
  totalBuscasAnterior: number
  porDia: Array<{
    date: string
    count: number
  }>
  porDispositivo: Array<{
    dispositivo: string
    count: number
  }>
  porCidade: Array<{
    cidade: string
    count: number
  }>
  antecedenciaMedia: number
  antecedenciaMediaAnterior: number
  duracaoMedia: number
  duracaoMediaAnterior: number
  distribuicaoAntecedencia: DistribuicaoItem[]
  distribuicaoDuracao: DistribuicaoItem[]
}

export async function getReservasAnalytics(filters: FilterState): Promise<ReservasAnalytics> {
  const supabase = createClient()

  try {
    if (!filters.startDate || !filters.endDate) {
      return getEmptyReservasAnalytics()
    }

    // 1. Buscar hotéis que correspondem aos filtros
    const hotelQuery = supabase
      .from('hoteis_config')
      .select('motor_id, motor_reserva')
      .eq('ativo', true)
    
    if (filters.selectedHotels.length > 0) {
      hotelQuery.in('nome_hotel', filters.selectedHotels)
    }
    if (filters.selectedCidades.length > 0) {
      hotelQuery.in('cidade', filters.selectedCidades)
    }
    if (filters.selectedEstados.length > 0) {
      hotelQuery.in('estado', filters.selectedEstados)
    }
    
    const { data: hoteisData, error: hotelError } = await hotelQuery
    
    if (hotelError) {
      console.error('[getReservasAnalytics] Erro ao buscar hotéis:', hotelError)
      throw hotelError
    }

    const motores = hoteisData?.map(h => ({ 
      motor_id: h.motor_id, 
      motor_reserva: h.motor_reserva 
    })).filter(h => h.motor_id && h.motor_reserva) || []

    if (motores.length === 0) {
      return getEmptyReservasAnalytics()
    }

    // 2. Chamar RPCs para agregar dados no banco (evita limites de linhas e melhora performance)
    // Garantir que a data final inclua todo o dia (para colunas de timestamp)
    const comparisonRange = filters.compareYearAgo
      ? getYearAgoRange(filters.startDate, filters.endDate)
      : getPreviousPeriodRange(filters.startDate, filters.endDate)

    const currentEndDateFull = filters.endDate.includes('T')
      ? filters.endDate
      : `${filters.endDate}T23:59:59`

    const previousEndDateFull = comparisonRange.endDate.includes('T')
      ? comparisonRange.endDate
      : `${comparisonRange.endDate}T23:59:59`

    const [
      kpisRes,
      chartRes,
      deviceRes,
      antecedenciaRes,
      duracaoRes,
      previousKpisRes,
    ] = await Promise.all([
      supabase.rpc('get_dashboard_kpis', { 
        p_motores: motores, 
        p_date_from: filters.startDate, 
        p_date_to: currentEndDateFull
      }),
      supabase.rpc('get_dashboard_buscas_chart', { 
        p_motores: motores, 
        p_date_from: filters.startDate, 
        p_date_to: currentEndDateFull
      }),
      supabase.rpc('get_dashboard_distribuicao_dispositivo', { 
        p_motores: motores, 
        p_date_from: filters.startDate, 
        p_date_to: currentEndDateFull
      }),
      supabase.rpc('get_dashboard_distribuicao_antecedencia', { 
        p_motores: motores, 
        p_date_from: filters.startDate, 
        p_date_to: currentEndDateFull
      }),
      supabase.rpc('get_dashboard_distribuicao_duracao', { 
        p_motores: motores, 
        p_date_from: filters.startDate, 
        p_date_to: currentEndDateFull
      }),
      supabase.rpc('get_dashboard_kpis', { 
        p_motores: motores, 
        p_date_from: comparisonRange.startDate, 
        p_date_to: previousEndDateFull
      }),
    ])

    if (kpisRes.error) console.error('[getReservasAnalytics] Erro RPC KPIs:', kpisRes.error)
    if (chartRes.error) console.error('[getReservasAnalytics] Erro RPC Chart:', chartRes.error)
    if (deviceRes.error) console.error('[getReservasAnalytics] Erro RPC Dispositivo:', deviceRes.error)
    if (antecedenciaRes.error) console.error('[getReservasAnalytics] Erro RPC Antecedência:', antecedenciaRes.error)
    if (duracaoRes.error) console.error('[getReservasAnalytics] Erro RPC Duração:', duracaoRes.error)
    if (previousKpisRes.error) console.error('[getReservasAnalytics] Erro RPC KPIs Anteriores:', previousKpisRes.error)

    const kpiData = kpisRes.data?.[0] || { total_buscas: 0, antecedencia_media: 0, duracao_media: 0 }
    const previousKpiData = previousKpisRes.data?.[0] || { total_buscas: 0, antecedencia_media: 0, duracao_media: 0 }

    return {
      totalBuscas: Number(kpiData.total_buscas || 0),
      totalBuscasAnterior: Number(previousKpiData.total_buscas || 0),
      porDia: (chartRes.data || []).map((d: any) => ({
        date: d.data,
        count: Number(d.buscas || 0)
      })),
      porDispositivo: (deviceRes.data || []).map((d: any) => ({
        dispositivo: d.dispositivo,
        count: Number(d.count || 0)
      })),
      porCidade: [], // Requer lógica adicional se necessário
      antecedenciaMedia: Number(kpiData.antecedencia_media || 0),
      antecedenciaMediaAnterior: Number(previousKpiData.antecedencia_media || 0),
      duracaoMedia: Number(kpiData.duracao_media || 0),
      duracaoMediaAnterior: Number(previousKpiData.duracao_media || 0),
      distribuicaoAntecedencia: mapDistributionData(antecedenciaRes.data || []),
      distribuicaoDuracao: mapDistributionData(duracaoRes.data || []),
    }
  } catch (error: any) {
    console.error('[getReservasAnalytics] Erro geral:', error)
    return getEmptyReservasAnalytics()
  }
}

function mapDistributionData(rows: any[] = []): DistribuicaoItem[] {
  return rows.map(row => {
    const labelSource = row.faixa 
      ?? row.range 
      ?? row.label 
      ?? row.nome 
      ?? row.bucket 
      ?? row.periodo
    const faixa = labelSource ? String(labelSource).trim() : 'Sem faixa'
    const rawCount = row.count ?? row.quantidade ?? row.value ?? row.total ?? row.buscas ?? row.reservas ?? 0
    const count = Number(rawCount || 0)
    return { faixa, count }
  }).filter(item => item.faixa)
}

function getEmptyReservasAnalytics(): ReservasAnalytics {
  return {
    totalBuscas: 0,
    totalBuscasAnterior: 0,
    porDia: [],
    porDispositivo: [],
    porCidade: [],
    antecedenciaMedia: 0,
    antecedenciaMediaAnterior: 0,
    duracaoMedia: 0,
    duracaoMediaAnterior: 0,
    distribuicaoAntecedencia: [],
    distribuicaoDuracao: [],
  }
}
