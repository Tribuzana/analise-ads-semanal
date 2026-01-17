'use client'

import { useState, useEffect } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { getLast4WeeksData } from '@/lib/actions/dashboard/get-metrics'
import { processLast4WeeksTemporalData, calculateCampaignStatusKPIs } from '@/lib/utils/dashboard-helpers'

export function useLast4Weeks() {
  const filters = useFilterContext()
  const [temporalData, setTemporalData] = useState<Array<{ date: string; spend: number; revenue: number; roas: number }>>([])
  const [campaignKPIs, setCampaignKPIs] = useState<{
    activeGoogle: number
    pausedGoogle: number
    activeMeta: number
    pausedMeta: number
  }>({
    activeGoogle: 0,
    pausedGoogle: 0,
    activeMeta: 0,
    pausedMeta: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const data = await getLast4WeeksData({
          selectedHotels: filters.selectedHotels,
          selectedCidades: filters.selectedCidades,
          selectedEstados: filters.selectedEstados,
        })
        
        const processedTemporal = processLast4WeeksTemporalData(data)
        const kpis = calculateCampaignStatusKPIs(data)
        
        setTemporalData(processedTemporal)
        setCampaignKPIs(kpis)
      } catch (err: any) {
        const errorMessage = err.message || 'Erro desconhecido ao buscar dados das últimas 4 semanas'
        setError(errorMessage)
        console.error('[useLast4Weeks] Erro:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    filters.selectedHotels.join(','),
    filters.selectedCidades.join(','),
    filters.selectedEstados.join(','),
  ])

  return { temporalData, campaignKPIs, loading, error }
}
