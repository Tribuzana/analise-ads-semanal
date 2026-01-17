'use server'

import { createClient } from '@/lib/supabase/server'
import type { FilterState } from '@/types'

export interface ReservasAnalytics {
  totalBuscas: number
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
  duracaoMedia: number
}

export async function getReservasAnalytics(filters: FilterState): Promise<ReservasAnalytics> {
  const supabase = createClient()

  try {
    if (!filters.startDate || !filters.endDate) {
      return {
        totalBuscas: 0,
        porDia: [],
        porDispositivo: [],
        porCidade: [],
        antecedenciaMedia: 0,
        duracaoMedia: 0,
      }
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
      return {
        totalBuscas: 0,
        porDia: [],
        porDispositivo: [],
        porCidade: [],
        antecedenciaMedia: 0,
        duracaoMedia: 0,
      }
    }

    // 2. Chamar RPCs para agregar dados no banco (evita limites de linhas e melhora performance)
    // Garantir que a data final inclua todo o dia (para colunas de timestamp)
    const endDateFull = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate}T23:59:59`
    
    const [kpisRes, chartRes, deviceRes] = await Promise.all([
      supabase.rpc('get_dashboard_kpis', { 
        p_motores: motores, 
        p_date_from: filters.startDate, 
        p_date_to: endDateFull
      }),
      supabase.rpc('get_dashboard_buscas_chart', { 
        p_motores: motores, 
        p_date_from: filters.startDate, 
        p_date_to: endDateFull
      }),
      supabase.rpc('get_dashboard_distribuicao_dispositivo', { 
        p_motores: motores, 
        p_date_from: filters.startDate, 
        p_date_to: endDateFull
      })
    ])

    if (kpisRes.error) console.error('[getReservasAnalytics] Erro RPC KPIs:', kpisRes.error)
    if (chartRes.error) console.error('[getReservasAnalytics] Erro RPC Chart:', chartRes.error)
    if (deviceRes.error) console.error('[getReservasAnalytics] Erro RPC Dispositivo:', deviceRes.error)

    const kpiData = kpisRes.data?.[0] || { total_buscas: 0, antecedencia_media: 0, duracao_media: 0 }
    
    return {
      totalBuscas: Number(kpiData.total_buscas || 0),
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
      duracaoMedia: Number(kpiData.duracao_media || 0),
    }
  } catch (error: any) {
    console.error('[getReservasAnalytics] Erro geral:', error)
    return {
      totalBuscas: 0,
      porDia: [],
      porDispositivo: [],
      porCidade: [],
      antecedenciaMedia: 0,
      duracaoMedia: 0,
    }
  }
}
