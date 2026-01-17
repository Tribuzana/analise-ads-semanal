'use client'

import { useState, useEffect } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { generateAlerts } from '@/lib/actions/alertas/generate-alerts'
import type { Alert, AlertStats } from '@/types/alertas'
import type { FilterState } from '@/types'

export function useAlertas() {
  const filters = useFilterContext()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAlerts() {
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
        const data = await generateAlerts(filterState)
        
        // Filtrar alertas já resolvidos do localStorage
        const resolved = getResolvedAlerts()
        const filteredAlerts = data.filter(a => !resolved.includes(a.id))
        
        setAlerts(filteredAlerts)
      } catch (err: any) {
        setError(err.message)
        console.error('[useAlertas] Erro ao buscar alertas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
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

  const stats: AlertStats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  }

  const resolveAlert = (alertId: string) => {
    const resolved = getResolvedAlerts()
    if (!resolved.includes(alertId)) {
      resolved.push(alertId)
      localStorage.setItem('tribuzana_resolved_alerts', JSON.stringify(resolved))
      setAlerts(alerts.filter(a => a.id !== alertId))
    }
  }

  return { alerts, loading, error, stats, resolveAlert }
}

function getResolvedAlerts(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('tribuzana_resolved_alerts')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}
