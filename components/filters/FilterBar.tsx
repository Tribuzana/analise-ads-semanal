'use client'

import { HotelSelector } from './HotelSelector'
import { DateRangeSelector } from './DateRangeSelector'
import { CidadeSelector } from './CidadeSelector'
import { EstadoSelector } from './EstadoSelector'
import { AdvancedFilters } from './AdvancedFilters'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useFilterContext } from '@/contexts/FilterContext'

export function FilterBar() {
  const { resetFilters } = useFilterContext()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <HotelSelector />
      <CidadeSelector />
      <EstadoSelector />
      <DateRangeSelector />
      <AdvancedFilters />
      <Button
        variant="ghost"
        size="sm"
        onClick={resetFilters}
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Limpar filtros
      </Button>
    </div>
  )
}
