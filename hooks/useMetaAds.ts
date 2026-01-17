'use client'

import { useState, useEffect } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { getMarketingAnalytics } from '@/lib/actions/marketing-analytics/get-analytics'
import type { MarketingAnalyticsData } from '@/types/marketing'

export function useMetaAds() {
  const filters = useFilterContext()
  const [data, setData] = useState<MarketingAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      // Não buscar se as datas não estiverem definidas
      if (!filters.startDate || !filters.endDate) {
        console.warn('[useMetaAds] Datas não definidas')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Passar apenas valores primitivos, não funções
        const filterState = {
          selectedHotels: filters.selectedHotels,
          startDate: filters.startDate,
          endDate: filters.endDate,
          selectedCidades: filters.selectedCidades,
          selectedEstados: filters.selectedEstados,
          compareYearAgo: filters.compareYearAgo,
          selectedObjectives: filters.selectedObjectives,
          selectedResultTypes: filters.selectedResultTypes,
        }
        console.log('[useMetaAds] Buscando dados do Meta Ads')
        const result = await getMarketingAnalytics(filterState, {
          platforms: ['Meta', 'Meta Ads'],
        })
        console.log('[useMetaAds] Dados recebidos:', {
          campaigns: result.campaigns.length,
        })
        setData(result)
      } catch (err: any) {
        const errorMessage = err.message || 'Erro desconhecido ao buscar dados do Meta Ads'
        setError(errorMessage)
        console.error('[useMetaAds] Erro:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    filters.selectedHotels,
    filters.startDate,
    filters.endDate,
    filters.selectedCidades,
    filters.selectedEstados,
    filters.compareYearAgo,
    filters.selectedObjectives,
    filters.selectedResultTypes,
  ])

  return { data, loading, error }
}
