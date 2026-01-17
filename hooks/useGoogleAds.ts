'use client'

import { useState, useEffect } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { getMarketingAnalytics } from '@/lib/actions/marketing-analytics/get-analytics'
import type { MarketingAnalyticsData } from '@/types/marketing'

export function useGoogleAds() {
  const filters = useFilterContext()
  const [data, setData] = useState<MarketingAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      // Não buscar se as datas não estiverem definidas
      if (!filters.startDate || !filters.endDate) {
        console.warn('[useGoogleAds] Datas não definidas')
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
        console.log('[useGoogleAds] Buscando dados do Google Ads')
        const result = await getMarketingAnalytics(filterState, {
          platforms: ['Google', 'Google Ads'],
        })
        console.log('[useGoogleAds] Dados recebidos:', {
          campaigns: result.campaigns.length,
        })
        setData(result)
      } catch (err: any) {
        const errorMessage = err.message || 'Erro desconhecido ao buscar dados do Google Ads'
        setError(errorMessage)
        console.error('[useGoogleAds] Erro:', err)
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
  ])

  return { data, loading, error }
}
