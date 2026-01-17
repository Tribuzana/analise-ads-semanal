'use client'

import { useState } from 'react'
import { useFilterContext } from '@/contexts/FilterContext'
import { useHoteis } from '@/hooks/useHoteis'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Hotel, ChevronDown } from 'lucide-react'

export function HotelSelector() {
  const [open, setOpen] = useState(false)
  const { selectedHotels, setSelectedHotels } = useFilterContext()
  const { hoteis, loading } = useHoteis()

  const toggleHotel = (hotelName: string) => {
    if (selectedHotels.includes(hotelName)) {
      setSelectedHotels(selectedHotels.filter(h => h !== hotelName))
    } else {
      setSelectedHotels([...selectedHotels, hotelName])
    }
  }

  const selectAll = () => {
    setSelectedHotels(hoteis.map(h => h.nome_hotel))
  }

  const clearAll = () => {
    setSelectedHotels([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between sm:w-[300px]">
          <div className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            <span>
              {selectedHotels.length === 0
                ? 'Selecione os hotéis'
                : `${selectedHotels.length} hotel(is) selecionado(s)`}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Hotéis</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="h-7 text-xs"
            >
              Todos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs"
            >
              Limpar
            </Button>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-3">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : hoteis.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              Nenhum hotel encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {hoteis.map((hotel) => (
                <div
                  key={hotel.id}
                  className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent"
                >
                  <Checkbox
                    id={hotel.nome_hotel}
                    checked={selectedHotels.includes(hotel.nome_hotel)}
                    onCheckedChange={() => toggleHotel(hotel.nome_hotel)}
                  />
                  <label
                    htmlFor={hotel.nome_hotel}
                    className="flex-1 cursor-pointer text-sm font-medium leading-none whitespace-nowrap peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {hotel.nome_fantasia || hotel.nome_hotel}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
