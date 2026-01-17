'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getDefaultDateRange } from '@/lib/utils/date-helpers'
import type { FilterState } from '@/types'

interface FilterContextType extends FilterState {
  setSelectedHotels: (hotels: string[]) => void
  setDateRange: (start: string, end: string) => void
  setSelectedCidades: (cidades: string[]) => void
  setSelectedEstados: (estados: string[]) => void
  setCompareYearAgo: (compare: boolean) => void
  setSelectedObjectives: (objectives: string[]) => void
  setSelectedResultTypes: (resultTypes: string[]) => void
  resetFilters: () => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange()
  
  const [selectedHotels, setSelectedHotels] = useState<string[]>([])
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [selectedCidades, setSelectedCidades] = useState<string[]>([])
  const [selectedEstados, setSelectedEstados] = useState<string[]>([])
  const [compareYearAgo, setCompareYearAgo] = useState(false)
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([])
  const [selectedResultTypes, setSelectedResultTypes] = useState<string[]>([])

  // Persistir filtros no localStorage
  useEffect(() => {
    // Só tentar carregar do localStorage se estiver no cliente
    if (typeof window === 'undefined') return
    
    const savedFilters = localStorage.getItem('tribuzana_filters')
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        if (parsed.selectedHotels) setSelectedHotels(parsed.selectedHotels)
        if (parsed.startDate) setStartDate(parsed.startDate)
        if (parsed.endDate) setEndDate(parsed.endDate)
        if (parsed.selectedCidades) setSelectedCidades(parsed.selectedCidades)
        if (parsed.selectedEstados) setSelectedEstados(parsed.selectedEstados)
        if (parsed.compareYearAgo !== undefined) setCompareYearAgo(parsed.compareYearAgo)
      } catch (error) {
        console.error('Erro ao carregar filtros salvos:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Só salvar no localStorage se estiver no cliente e se as datas estiverem definidas
    if (typeof window === 'undefined') return
    if (!startDate || !endDate) return
    
    const filters = {
      selectedHotels,
      startDate,
      endDate,
      selectedCidades,
      selectedEstados,
      compareYearAgo,
      selectedObjectives,
      selectedResultTypes,
    }
    localStorage.setItem('tribuzana_filters', JSON.stringify(filters))
  }, [selectedHotels, startDate, endDate, selectedCidades, selectedEstados, compareYearAgo, selectedObjectives, selectedResultTypes])

  const setDateRange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
  }

  const resetFilters = () => {
    setSelectedHotels([])
    const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange()
    setStartDate(defaultStart)
    setEndDate(defaultEnd)
    setSelectedCidades([])
    setSelectedEstados([])
    setCompareYearAgo(false)
    setSelectedObjectives([])
    setSelectedResultTypes([])
  }

  return (
    <FilterContext.Provider
      value={{
        selectedHotels,
        startDate,
        endDate,
        selectedCidades,
        selectedEstados,
        compareYearAgo,
        selectedObjectives,
        selectedResultTypes,
        setSelectedHotels,
        setDateRange,
        setSelectedCidades,
        setSelectedEstados,
        setCompareYearAgo,
        setSelectedObjectives,
        setSelectedResultTypes,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export const useFilterContext = () => {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider')
  }
  return context
}

// Manter compatibilidade com código antigo
export const useFilters = useFilterContext
