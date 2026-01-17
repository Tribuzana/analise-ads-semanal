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

    // Buscar hotéis que correspondem aos filtros
    let hotelIds: number[] = []
    if (filters.selectedHotels.length > 0 || filters.selectedCidades.length > 0 || filters.selectedEstados.length > 0) {
      const hotelQuery = supabase
        .from('hoteis_config')
        .select('id, motor_id')
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
      
      const { data: hoteisFiltrados } = await hotelQuery
      hotelIds = hoteisFiltrados?.map(h => h.id) || []
    }

    // Query base
    let query = supabase
      .from('coletas_reservas')
      .select('*')
      .gte('data_coleta', filters.startDate)
      .lte('data_coleta', filters.endDate)

    // Filtrar por motor_id se houver hotéis selecionados
    if (hotelIds.length > 0) {
      const { data: hoteisData } = await supabase
        .from('hoteis_config')
        .select('motor_id')
        .in('id', hotelIds)
      
      const motorIds = hoteisData?.map(h => h.motor_id).filter(Boolean) || []
      if (motorIds.length > 0) {
        query = query.in('motor_id', motorIds)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('[getReservasAnalytics] Erro:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return {
        totalBuscas: 0,
        porDia: [],
        porDispositivo: [],
        porCidade: [],
        antecedenciaMedia: 0,
        duracaoMedia: 0,
      }
    }

    // Agregar por dia
    const porDiaMap = new Map<string, number>()
    data.forEach(row => {
      const date = new Date(row.data_coleta).toISOString().split('T')[0]
      porDiaMap.set(date, (porDiaMap.get(date) || 0) + 1)
    })

    const porDia = Array.from(porDiaMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Agregar por dispositivo
    const porDispositivoMap = new Map<string, number>()
    data.forEach(row => {
      const dispositivo = row.dispositivo || 'Não informado'
      porDispositivoMap.set(dispositivo, (porDispositivoMap.get(dispositivo) || 0) + 1)
    })

    const porDispositivo = Array.from(porDispositivoMap.entries())
      .map(([dispositivo, count]) => ({ dispositivo, count }))
      .sort((a, b) => b.count - a.count)

    // Calcular médias
    const antecedencias = data
      .map(r => r.antecedencia_dias)
      .filter((a): a is number => a !== null && a !== undefined)
    
    const duracoes = data
      .map(r => r.duracao_dias)
      .filter((d): d is number => d !== null && d !== undefined)

    const antecedenciaMedia = antecedencias.length > 0
      ? antecedencias.reduce((sum, val) => sum + val, 0) / antecedencias.length
      : 0

    const duracaoMedia = duracoes.length > 0
      ? duracoes.reduce((sum, val) => sum + val, 0) / duracoes.length
      : 0

    return {
      totalBuscas: data.length,
      porDia,
      porDispositivo,
      porCidade: [], // Seria necessário buscar cidade do hotel
      antecedenciaMedia: Math.round(antecedenciaMedia),
      duracaoMedia: Math.round(duracaoMedia),
    }
  } catch (error: any) {
    console.error('[getReservasAnalytics] Erro:', error)
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
