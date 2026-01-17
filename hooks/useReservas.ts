'use client'

import { useState, useEffect } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { getReservasAnalytics, type ReservasAnalytics } from '@/lib/actions/reservas/get-analytics'
import type { FilterState } from '@/types'

export function useReservas() {
  const filters = useFilterContext()
  const [data, setData] = useState<ReservasAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!filters.startDate || !filters.endDate) {
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
        const result = await getReservasAnalytics(filterState)
        setData(result)
      } catch (err: any) {
        setError(err.message)
        console.error('[useReservas] Erro:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    filters.startDate,
    filters.endDate,
    filters.selectedHotels,
    filters.selectedCidades,
    filters.selectedEstados,
    filters.compareYearAgo,
    filters.selectedObjectives,
    filters.selectedResultTypes,
  ])

  return { data, loading, error }
}
