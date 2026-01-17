'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, CalendarDays, X } from 'lucide-react'
import { DateRange, SelectRangeEventHandler } from 'react-day-picker'
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

  const handleSelect: SelectRangeEventHandler = (range, selectedDay) => {
    setTempDate((prev) => {
      // Ignorar eventos sem dia clicado (ex.: limpar seleção)
      if (!selectedDay) return range

      const prevFromDate = prev?.from ?? null
      const prevToDate = prev?.to ?? null

      // Estado determinístico:
      // - sem seleção -> inicia
      // - só início -> define fim (ou inverte se clicou antes)
      // - início+fim -> reinicia (nova seleção)
      let next: DateRange | undefined
      if (!prevFromDate) {
        next = { from: selectedDay, to: undefined }
      } else if (!prevToDate) {
        if (selectedDay.getTime() < prevFromDate.getTime()) {
          next = { from: selectedDay, to: prevFromDate }
        } else {
          next = { from: prevFromDate, to: selectedDay }
        }
      } else {
        next = { from: selectedDay, to: undefined }
      }

      const prevFrom = prevFromDate ? format(prevFromDate, 'yyyy-MM-dd') : null
      const prevTo = prevToDate ? format(prevToDate, 'yyyy-MM-dd') : null
      const clicked = format(selectedDay, 'yyyy-MM-dd')
      const rangeFrom = range?.from ? format(range.from, 'yyyy-MM-dd') : null
      const rangeTo = range?.to ? format(range.to, 'yyyy-MM-dd') : null
      const nextFrom = next?.from ? format(next.from, 'yyyy-MM-dd') : null
      const nextTo = next?.to ? format(next.to, 'yyyy-MM-dd') : null

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run5',hypothesisId:'H10',location:'components/filters/DateRangeSelector.tsx:handleSelect',message:'Range select event (deterministic)',data:{clicked,prevFrom,prevTo,rangeFrom,rangeTo,nextFrom,nextTo},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      return next
    })
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

    // Aplica imediatamente ao clicar em períodos rápidos
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run8',hypothesisId:'H14',location:'components/filters/DateRangeSelector.tsx:applyPreset',message:'Apply preset',data:{preset,startDate:range.startDate,endDate:range.endDate,compareYearAgo:tempCompareYearAgo},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    setDateRange(range.startDate, range.endDate)
    setCompareYearAgo(tempCompareYearAgo)
    setOpen(false)
  }

  const handleApply = () => {
    if (!tempDate?.from || !tempDate?.to) return

    const start = format(tempDate.from, 'yyyy-MM-dd')
    const end = format(tempDate.to, 'yyyy-MM-dd')

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run8',hypothesisId:'H14',location:'components/filters/DateRangeSelector.tsx:handleApply',message:'Apply custom range',data:{start,end,compareYearAgo:tempCompareYearAgo},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    setDateRange(start, end)
    setCompareYearAgo(tempCompareYearAgo)
    setOpen(false)
  }

  const handleClear = () => {
    const range = getDefaultDateRange()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run8',hypothesisId:'H14',location:'components/filters/DateRangeSelector.tsx:handleClear',message:'Clear date range (reset to default)',data:{startDate:range.startDate,endDate:range.endDate},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    setTempDate({ from: parseISO(range.startDate), to: parseISO(range.endDate) })
    setTempCompareYearAgo(false)
    setDateRange(range.startDate, range.endDate)
    setCompareYearAgo(false)
    setOpen(false)
  }

  const currentDate = tempDate || (startDate && endDate ? {
    from: parseISO(startDate),
    to: parseISO(endDate),
  } : undefined)

  return (
    <div className="flex flex-col gap-2">
      <Popover
        open={open}
        onOpenChange={(v) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H5',location:'components/filters/DateRangeSelector.tsx:onOpenChange',message:'DateRange popover open change',data:{open:v},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          // Se fechar no meio de uma seleção (só início), volta para o valor aplicado no filtro
          if (!v) {
            if (startDate && endDate) {
              try {
                setTempDate({ from: parseISO(startDate), to: parseISO(endDate) })
              } catch {
                setTempDate(undefined)
              }
            } else {
              setTempDate(undefined)
            }
            setTempCompareYearAgo(compareYearAgo)
          }
          setOpen(v)
        }}
      >
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
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('lastWeek')}
                  className={cn(
                    "text-xs h-8 w-full px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground border-muted-foreground/20 font-normal justify-start",
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
                    "text-xs h-8 w-full px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground border-muted-foreground/20 font-normal justify-start",
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
                    "text-xs h-8 w-full px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground border-muted-foreground/20 font-normal justify-start",
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
                    "text-xs h-8 w-full px-3 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground border-muted-foreground/20 font-normal justify-start",
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
              {/* #region agent log */}
              {(() => { fetch('http://127.0.0.1:7242/ingest/6842f4ba-3edf-4bcb-a366-f1f6e88ff0d8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'components/filters/DateRangeSelector.tsx:CalendarProps',message:'Rendering Calendar with props',data:{mode:'range',numberOfMonths:1,defaultMonth:String(tempDate?.from||''),hasSelected:Boolean(tempDate),selectedFrom:String(tempDate?.from||''),selectedTo:String(tempDate?.to||''),popoverClass:'w-auto p-0'},timestamp:Date.now()})}).catch(()=>{}); return null })()}
              {/* #endregion */}
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
                onClick={handleClear}
                className="bg-background"
              >
                Limpar
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
