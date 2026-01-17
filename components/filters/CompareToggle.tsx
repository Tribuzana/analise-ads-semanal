'use client'

import { useFilterContext } from '@/contexts/FilterContext'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'

export function CompareToggle() {
  const { compareYearAgo, setCompareYearAgo } = useFilterContext()

  return (
    <Button
      variant={compareYearAgo ? 'default' : 'outline'}
      size="sm"
      onClick={() => setCompareYearAgo(!compareYearAgo)}
      className="gap-2"
    >
      <CalendarDays className="h-4 w-4" />
      Comparar com ano anterior
    </Button>
  )
}
