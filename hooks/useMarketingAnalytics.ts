'use client'

import { useState, useEffect } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { getMarketingAnalytics } from '@/lib/actions/marketing-analytics/get-analytics'
import type { MarketingAnalyticsData } from '@/types/marketing'
import type { FilterState } from '@/types'

interface Options {
  platforms?: string[]
  objectives?: string[]
  statuses?: string[]
  resultTypes?: string[]
}

export function useMarketingAnalytics(options?: Options) {
  const filters = useFilterContext()
  const [data, setData] = useState<MarketingAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      // Não buscar se as datas não estiverem definidas
      if (!filters.startDate || !filters.endDate) {
        console.warn('[useMarketingAnalytics] Datas não definidas')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Passar apenas valores primitivos, não funções
        const filterState: FilterState = {
          selectedHotels: filters.selectedHotels,
          startDate: filters.startDate,
          endDate: filters.endDate,
          selectedCidades: filters.selectedCidades,
          selectedEstados: filters.selectedEstados,
          compareYearAgo: filters.compareYearAgo,
          selectedObjectives: filters.selectedObjectives,
          selectedResultTypes: filters.selectedResultTypes,
        }
        console.log('[useMarketingAnalytics] Buscando analytics com filtros:', {
          startDate: filterState.startDate,
          endDate: filterState.endDate,
          selectedHotels: filterState.selectedHotels.length,
        })
        const result = await getMarketingAnalytics(filterState, options)
        console.log('[useMarketingAnalytics] Dados recebidos:', {
          campaigns: result.campaigns.length,
          objectives: result.objectiveAnalysis.length,
          temporal: result.temporalData.length,
        })
        setData(result)
      } catch (err: any) {
        const errorMessage = err.message || 'Erro desconhecido ao buscar analytics'
        setError(errorMessage)
        console.error('[useMarketingAnalytics] Erro:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    filters.selectedHotels.join(','),
    filters.startDate,
    filters.endDate,
    filters.selectedCidades.join(','),
    filters.selectedEstados.join(','),
    filters.compareYearAgo,
    filters.selectedObjectives.join(','),
    filters.selectedResultTypes.join(','),
    options?.platforms?.join(','),
    options?.objectives?.join(','),
    options?.statuses?.join(','),
    options?.resultTypes?.join(','),
  ])

  return { data, loading, error }
}
