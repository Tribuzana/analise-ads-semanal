'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, CalendarDays, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFilterContext } from '@/contexts/FilterContext'
import {
  getDefaultDateRange,
  getLastWeek,
  getThisMonth,
  getLastMonth,
} from '@/lib/utils/date-helpers'

export function DateRangeSelector() {
  const { startDate, endDate, setDateRange, compareYearAgo, setCompareYearAgo } = useFilterContext()
  const [open, setOpen] = useState(false)
  const [tempDate, setTempDate] = useState<DateRange | undefined>(() => {
    if (startDate && endDate) {
      try {
        return {
          from: parseISO(startDate),
          to: parseISO(endDate),
        }
      } catch {
        return undefined
      }
    }
    return undefined
  })
  const [tempCompareYearAgo, setTempCompareYearAgo] = useState(compareYearAgo)

  useEffect(() => {
    if (startDate && endDate) {
      try {
        const fromDate = parseISO(startDate)
        const toDate = parseISO(endDate)
        if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
          setTempDate({
            from: fromDate,
            to: toDate,
          })
        }
      } catch {
        // Ignorar erros de data inválida
      }
    }
  }, [startDate, endDate])

  useEffect(() => {
    setTempCompareYearAgo(compareYearAgo)
  }, [compareYearAgo])

  const handleSelect = (range: DateRange | undefined) => {
    setTempDate(range)
  }

  const applyPreset = (preset: 'default' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    let range
    switch (preset) {
      case 'default':
        range = getDefaultDateRange()
        break
      case 'lastWeek':
        range = getLastWeek()
        break
      case 'thisMonth':
        range = getThisMonth()
        break
      case 'lastMonth':
        range = getLastMonth()
        break
    }
    
    setTempDate({
      from: parseISO(range.startDate),
      to: parseISO(range.endDate),
    })
  }

  const handleApply = () => {
    if (tempDate?.from && tempDate?.to) {
      setDateRange(
        format(tempDate.from, 'yyyy-MM-dd'),
        format(tempDate.to, 'yyyy-MM-dd')
      )
      setCompareYearAgo(tempCompareYearAgo)
      setOpen(false)
    }
  }

  const handleCancel = () => {
    // Resetar para valores atuais
    if (startDate && endDate) {
      try {
        setTempDate({
          from: parseISO(startDate),
          to: parseISO(endDate),
        })
      } catch {
        setTempDate(undefined)
      }
    }
    setTempCompareYearAgo(compareYearAgo)
    setOpen(false)
  }

  const currentDate = tempDate || (startDate && endDate ? {
    from: parseISO(startDate),
    to: parseISO(endDate),
  } : undefined)

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal sm:w-[300px]',
              !currentDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentDate?.from ? (
              currentDate.to ? (
                <>
                  {format(currentDate.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                  {format(currentDate.to, 'dd/MM/yyyy', { locale: ptBR })}
                </>
              ) : (
                format(currentDate.from, 'dd/MM/yyyy', { locale: ptBR })
              )
            ) : (
              <span>Selecione o período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col">
            {/* Seção: Períodos rápidos */}
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium text-foreground mb-3">Períodos rápidos</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('lastWeek')}
                  className={cn(
                    "text-xs h-8 px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground border-muted-foreground/20 font-normal",
                    tempDate?.from && tempDate?.to &&
                    format(tempDate.from, 'yyyy-MM-dd') === getLastWeek().startDate &&
                    format(tempDate.to, 'yyyy-MM-dd') === getLastWeek().endDate &&
                    "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  Semana passada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('default')}
                  className={cn(
                    "text-xs h-8 px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground border-muted-foreground/20 font-normal",
                    tempDate?.from && tempDate?.to &&
                    format(tempDate.from, 'yyyy-MM-dd') === getDefaultDateRange().startDate &&
                    format(tempDate.to, 'yyyy-MM-dd') === getDefaultDateRange().endDate &&
                    "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  Últimos 7 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('thisMonth')}
                  className={cn(
                    "text-xs h-8 px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground border-muted-foreground/20 font-normal",
                    tempDate?.from && tempDate?.to &&
                    format(tempDate.from, 'yyyy-MM-dd') === getThisMonth().startDate &&
                    format(tempDate.to, 'yyyy-MM-dd') === getThisMonth().endDate &&
                    "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  Este mês
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('lastMonth')}
                  className={cn(
                    "text-xs h-8 px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground border-muted-foreground/20 font-normal",
                    tempDate?.from && tempDate?.to &&
                    format(tempDate.from, 'yyyy-MM-dd') === getLastMonth().startDate &&
                    format(tempDate.to, 'yyyy-MM-dd') === getLastMonth().endDate &&
                    "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  Mês passado
                </Button>
              </div>
              
              {/* Botão Comparar com ano anterior */}
              <Button
                variant={tempCompareYearAgo ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTempCompareYearAgo(!tempCompareYearAgo)}
                className="w-full gap-2 h-9"
              >
                <CalendarDays className="h-4 w-4" />
                Comparar com ano anterior
              </Button>
            </div>
            
            {/* Seção: Período personalizado */}
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium text-foreground mb-3">Período personalizado</h3>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDate?.from}
                selected={tempDate}
                onSelect={handleSelect}
                numberOfMonths={1}
                locale={ptBR}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="gap-2 bg-background"
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                disabled={!tempDate?.from || !tempDate?.to}
                className="bg-primary hover:bg-primary/90"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
