'use client'

import { useState, useEffect } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { getDashboardMetrics } from '@/lib/actions/dashboard/get-metrics'
import type { DashboardMetrics } from '@/types/dashboard'
import type { FilterState } from '@/types'

export function useDashboard() {
  const filters = useFilterContext()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      // Não buscar se as datas não estiverem definidas
      if (!filters.startDate || !filters.endDate) {
        console.warn('[useDashboard] Datas não definidas:', { startDate: filters.startDate, endDate: filters.endDate })
        setLoading(false)
        return
      }

      console.log('[useDashboard] Buscando métricas com filtros:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        selectedHotels: filters.selectedHotels.length,
      })

      setLoading(true)
      setError(null)
      try {
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

        const data = await getDashboardMetrics(filterState)
        console.log('[useDashboard] Métricas recebidas:', {
          geral: data.geral,
          googleAds: data.googleAds,
          metaAds: data.metaAds,
        })
        setMetrics(data)
      } catch (err: any) {
        const errorMessage = err.message || 'Erro desconhecido ao buscar métricas'
        setError(errorMessage)
        console.error('[useDashboard] Erro ao buscar métricas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
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

  return { metrics, loading, error }
}
